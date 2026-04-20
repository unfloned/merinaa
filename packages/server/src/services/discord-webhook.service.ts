import { Injectable } from '@merinaa/core';
import { ConfigService } from './config.service';
import { LoggerService } from './logger.service';

/**
 * Discord embed author block.
 */
export interface DiscordEmbedAuthor {
    name: string;
    url?: string;
    icon_url?: string;
}

/**
 * Discord embed footer block.
 */
export interface DiscordEmbedFooter {
    text: string;
    icon_url?: string;
}

/**
 * Discord embed field.
 */
export interface DiscordEmbedField {
    name: string;
    value: string;
    inline?: boolean;
}

/**
 * Discord rich embed payload. See Discord API docs for full spec.
 */
export interface DiscordEmbed {
    title?: string;
    description?: string;
    url?: string;
    /** Decimal color, e.g. `0x22c55e`. */
    color?: number;
    /** ISO-8601 timestamp string. */
    timestamp?: string;
    author?: DiscordEmbedAuthor;
    footer?: DiscordEmbedFooter;
    fields?: DiscordEmbedField[];
    thumbnail?: { url: string };
    image?: { url: string };
}

/**
 * Webhook message payload.
 */
export interface DiscordWebhookMessage {
    content?: string;
    username?: string;
    avatar_url?: string;
    embeds?: DiscordEmbed[];
    /** Allowed mentions (rate-limit user/role mentions). */
    allowed_mentions?: {
        parse?: ('users' | 'roles' | 'everyone')[];
        roles?: string[];
        users?: string[];
    };
}

/**
 * Options for sending a webhook.
 */
export interface SendOptions {
    /** Override the default webhook URL (from `discord.webhook` config). */
    webhookUrl?: string;
    /** Get the message ID back for later edits. Uses `?wait=true`. */
    waitForMessage?: boolean;
}

/**
 * Handle returned from a `waitForMessage` send — use to edit/delete later.
 */
export interface DiscordMessageHandle {
    webhookUrl: string;
    messageId: string;
}

/**
 * Stateless Discord webhook service.
 *
 * Uses Node's built-in `fetch` (Node 18+) — no `discord.js`, no bot token,
 * no gateway connection. Webhooks support message **editing** via
 * `PATCH /webhooks/{id}/{token}/messages/{id}`, so live test reports and
 * other editable updates are supported out of the box.
 *
 * Rate limits: Discord allows ~5 requests/sec per webhook. This service does
 * not queue aggressively — callers that send rapid updates should throttle
 * themselves (see the vitest reporter for an example).
 */
@Injectable()
export class DiscordWebhookService {
    private defaultWebhook: string | undefined;
    private defaultUsername: string | undefined;
    private defaultAvatarUrl: string | undefined;

    constructor(
        private readonly config: ConfigService,
        private readonly logger: LoggerService
    ) {
        this.defaultWebhook = this.config.get<string>('discord.webhook');
        this.defaultUsername = this.config.get<string>('discord.username');
        this.defaultAvatarUrl = this.config.get<string>('discord.avatarUrl');
    }

    /**
     * Send a new webhook message.
     *
     * @param message The payload (content + embeds).
     * @param options Optional override for URL / request a handle for later edits.
     * @returns Message handle if `waitForMessage: true`, otherwise `undefined`.
     */
    async send(
        message: DiscordWebhookMessage,
        options: SendOptions = {}
    ): Promise<DiscordMessageHandle | undefined> {
        const url = options.webhookUrl ?? this.defaultWebhook;
        if (!url) {
            this.logger.warn('DiscordWebhook', 'No webhook URL configured — skipping send');
            return undefined;
        }

        const payload = this.enrichPayload(message);
        const requestUrl = options.waitForMessage ? `${url}?wait=true` : url;

        try {
            const res = await fetch(requestUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const body = await res.text().catch(() => '<body read failed>');
                this.logger.error('DiscordWebhook', `Send failed: ${res.status} ${res.statusText} — ${body}`);
                return undefined;
            }

            if (!options.waitForMessage) return undefined;

            const json = (await res.json()) as { id?: string };
            if (!json.id) {
                this.logger.warn('DiscordWebhook', 'No message id in response despite wait=true');
                return undefined;
            }

            return { webhookUrl: url, messageId: json.id };
        } catch (err) {
            this.logger.error('DiscordWebhook', 'Fetch error:', err);
            return undefined;
        }
    }

    /**
     * Edit an existing webhook message. Requires the handle returned from
     * `send(..., { waitForMessage: true })`.
     */
    async edit(handle: DiscordMessageHandle, message: DiscordWebhookMessage): Promise<boolean> {
        const url = `${handle.webhookUrl}/messages/${handle.messageId}`;
        // Editing does NOT re-use username/avatar_url — Discord ignores those on PATCH.
        const payload: DiscordWebhookMessage = {
            content: message.content,
            embeds: message.embeds,
            allowed_mentions: message.allowed_mentions,
        };

        try {
            const res = await fetch(url, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const body = await res.text().catch(() => '<body read failed>');
                this.logger.error('DiscordWebhook', `Edit failed: ${res.status} ${res.statusText} — ${body}`);
                return false;
            }
            return true;
        } catch (err) {
            this.logger.error('DiscordWebhook', 'Edit fetch error:', err);
            return false;
        }
    }

    /**
     * Delete a previously sent message.
     */
    async delete(handle: DiscordMessageHandle): Promise<boolean> {
        const url = `${handle.webhookUrl}/messages/${handle.messageId}`;
        try {
            const res = await fetch(url, { method: 'DELETE' });
            if (!res.ok) {
                this.logger.error('DiscordWebhook', `Delete failed: ${res.status} ${res.statusText}`);
                return false;
            }
            return true;
        } catch (err) {
            this.logger.error('DiscordWebhook', 'Delete fetch error:', err);
            return false;
        }
    }

    /**
     * True if a default webhook URL is configured.
     */
    isEnabled(): boolean {
        return !!this.defaultWebhook;
    }

    private enrichPayload(message: DiscordWebhookMessage): DiscordWebhookMessage {
        return {
            username: message.username ?? this.defaultUsername,
            avatar_url: message.avatar_url ?? this.defaultAvatarUrl,
            content: message.content,
            embeds: message.embeds,
            allowed_mentions: message.allowed_mentions,
        };
    }
}
