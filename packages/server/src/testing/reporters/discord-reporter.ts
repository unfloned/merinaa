import type { Reporter, TestModule, TestCase, TestRunEndReason } from 'vitest/node' with { 'resolution-mode': 'import' };
import { frameworkConfigFromEnvOrFile } from './config-loader';

/**
 * Standalone reporter — does NOT depend on the production framework DI.
 *
 * The reporter runs in vitest's Node process (config-evaluation phase) which
 * doesn't have the framework's module resolution. Keep it self-contained:
 * no `@merinaa/*` imports, no Injectable, no DI container.
 */

interface DiscordEmbedField {
    name: string;
    value: string;
    inline?: boolean;
}

interface DiscordEmbed {
    title?: string;
    description?: string;
    color?: number;
    timestamp?: string;
    fields?: DiscordEmbedField[];
    footer?: { text: string };
}

interface WebhookMessage {
    content?: string;
    embeds?: DiscordEmbed[];
    allowed_mentions?: { parse?: string[]; roles?: string[]; users?: string[] };
}

/**
 * Configuration for the reporter.
 */
export interface DiscordReporterOptions {
    webhook?: string;
    mentionOnFail?: string;
    successColor?: number;
    failureColor?: number;
    throttleMs?: number;
    label?: string;
}

interface AggregateState {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    startedAt: number;
    finishedFiles: number;
    totalFiles: number;
    failures: Array<{ file: string; test: string; message: string }>;
}

/**
 * Vitest custom reporter that posts a live-updating Discord embed.
 *
 * - Sends one embed when tests start, edits it on progress, finalizes at end.
 * - Throttles edits to ~1 req/sec (Discord webhook rate-limit is ~5/s).
 * - Gracefully no-ops if no webhook URL is configured.
 */
export class DiscordReporter implements Reporter {
    private handle: { webhookUrl: string; messageId: string } | undefined;
    private lastEditAt = 0;
    private pendingEdit = false;
    private state: AggregateState;
    private enabled: boolean;
    private webhookUrl: string;
    private label: string;
    private successColor: number;
    private failureColor: number;
    private mentionOnFail: string | undefined;
    private throttleMs: number;

    constructor(userOptions: DiscordReporterOptions = {}) {
        const { options } = frameworkConfigFromEnvOrFile(userOptions);
        this.webhookUrl = options.webhook ?? '';
        this.label = options.label ?? 'Framework Tests';
        this.successColor = options.successColor ?? 0x22c55e;
        this.failureColor = options.failureColor ?? 0xef4444;
        this.mentionOnFail = options.mentionOnFail;
        this.throttleMs = options.throttleMs ?? 1500;
        this.enabled = !!this.webhookUrl;
        this.state = {
            total: 0,
            passed: 0,
            failed: 0,
            skipped: 0,
            startedAt: 0,
            finishedFiles: 0,
            totalFiles: 0,
            failures: [],
        };
    }

    async onTestRunStart(specifications: ReadonlyArray<{ moduleId: string }>): Promise<void> {
        if (!this.enabled) return;
        this.state.startedAt = Date.now();
        this.state.totalFiles = specifications.length;
        this.handle = await this.sendNew({ embeds: [this.buildEmbed('running')] });
    }

    onTestModuleEnd(testModule: TestModule): void {
        if (!this.enabled) return;
        this.state.finishedFiles++;
        for (const t of testModule.children.allTests()) {
            this.recordTest(t, testModule.moduleId);
        }
        this.scheduleEdit();
    }

    async onTestRunEnd(_modules: ReadonlyArray<TestModule>, _errors: ReadonlyArray<unknown>, reason: TestRunEndReason): Promise<void> {
        if (!this.enabled || !this.handle) return;
        const status = reason === 'passed' ? 'success' : 'failure';
        await this.edit(this.handle, {
            content: this.mentionLineForStatus(status),
            embeds: [this.buildEmbed(status)],
        });
    }

    private recordTest(test: TestCase, moduleId: string): void {
        const result = test.result();
        this.state.total++;
        switch (result.state) {
            case 'passed':
                this.state.passed++;
                break;
            case 'failed':
                this.state.failed++;
                this.state.failures.push({
                    file: moduleId,
                    test: test.fullName,
                    message: result.errors?.[0]?.message ?? 'unknown error',
                });
                break;
            case 'skipped':
            case 'pending':
                this.state.skipped++;
                break;
        }
    }

    private scheduleEdit(): void {
        if (!this.handle || this.pendingEdit) return;
        const sinceLast = Date.now() - this.lastEditAt;
        const wait = Math.max(0, this.throttleMs - sinceLast);
        this.pendingEdit = true;
        setTimeout(() => {
            void this.doEdit();
        }, wait);
    }

    private async doEdit(): Promise<void> {
        this.pendingEdit = false;
        if (!this.handle) return;
        this.lastEditAt = Date.now();
        await this.edit(this.handle, { embeds: [this.buildEmbed('running')] });
    }

    private buildEmbed(status: 'running' | 'success' | 'failure'): DiscordEmbed {
        const duration = ((Date.now() - this.state.startedAt) / 1000).toFixed(1);
        const statusIcon = status === 'running' ? '⏳' : status === 'success' ? '✅' : '❌';
        const color =
            status === 'success' ? this.successColor
                : status === 'failure' ? this.failureColor
                    : 0x3b82f6;

        const fields: DiscordEmbedField[] = [
            { name: 'Progress', value: `${this.state.finishedFiles} / ${this.state.totalFiles} files`, inline: true },
            { name: 'Passed', value: `✅ ${this.state.passed}`, inline: true },
            { name: 'Failed', value: `❌ ${this.state.failed}`, inline: true },
        ];
        if (this.state.skipped > 0) {
            fields.push({ name: 'Skipped', value: `⏭️ ${this.state.skipped}`, inline: true });
        }
        fields.push({ name: 'Duration', value: `${duration}s`, inline: true });

        if (this.state.failures.length > 0) {
            const list = this.state.failures.slice(0, 5)
                .map((f) => `• \`${f.test}\`\n  ↳ ${f.message.split('\n')[0]}`)
                .join('\n');
            const more = this.state.failures.length > 5 ? `\n… and ${this.state.failures.length - 5} more` : '';
            fields.push({ name: 'Failures', value: (list + more).slice(0, 1024), inline: false });
        }

        return {
            title: `${statusIcon} ${this.label}`,
            color,
            fields,
            timestamp: new Date().toISOString(),
            footer: { text: status === 'running' ? 'running…' : `finished in ${duration}s` },
        };
    }

    private mentionLineForStatus(status: 'success' | 'failure'): string | undefined {
        if (status !== 'failure' || !this.mentionOnFail) return undefined;
        return `<@&${this.mentionOnFail}> tests failed`;
    }

    private async sendNew(message: WebhookMessage): Promise<{ webhookUrl: string; messageId: string } | undefined> {
        try {
            const res = await fetch(`${this.webhookUrl}?wait=true`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(message),
            });
            if (!res.ok) {
                console.warn(`[DiscordReporter] send failed: ${res.status} ${res.statusText}`);
                return undefined;
            }
            const json = (await res.json()) as { id?: string };
            return json.id ? { webhookUrl: this.webhookUrl, messageId: json.id } : undefined;
        } catch (err) {
            console.warn('[DiscordReporter] send error:', err);
            return undefined;
        }
    }

    private async edit(handle: { webhookUrl: string; messageId: string }, message: WebhookMessage): Promise<boolean> {
        try {
            const res = await fetch(`${handle.webhookUrl}/messages/${handle.messageId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(message),
            });
            if (!res.ok) {
                console.warn(`[DiscordReporter] edit failed: ${res.status} ${res.statusText}`);
                return false;
            }
            return true;
        } catch (err) {
            console.warn('[DiscordReporter] edit error:', err);
            return false;
        }
    }
}
