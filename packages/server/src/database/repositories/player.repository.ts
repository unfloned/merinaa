import { Database } from '@deepkit/orm';
import { Injectable } from '@merinaa/core';
import { BaseRepository } from './base.repository';
import { Player, PlayerMoney } from '../entities/player.entity';

/**
 * Player repository
 * Provides database operations for Player entities
 */
@Injectable()
export class PlayerRepository extends BaseRepository<Player> {
    constructor(database: Database) {
        super(database, Player);
    }

    /**
     * Find player by license
     */
    async findByLicense(license: string): Promise<Player | undefined> {
        return this.query().filter({ license }).findOneOrUndefined();
    }

    /**
     * Find player by license or create new
     */
    async findOrCreate(license: string, name: string): Promise<{ player: Player; isNew: boolean }> {
        let player = await this.findByLicense(license);
        let isNew = false;

        if (!player) {
            player = Player.create(license, name);
            await this.save(player);
            isNew = true;
        } else {
            // Update name and last seen
            player.name = name;
            player.lastSeen = new Date();
            await this.save(player);
        }

        return { player, isNew };
    }

    /**
     * Find players by job name
     */
    async findByJob(jobName: string): Promise<Player[]> {
        return this.query()
            .filter({ job: { name: jobName } } as any)
            .find();
    }

    /**
     * Find players by gang name
     */
    async findByGang(gangName: string): Promise<Player[]> {
        return this.query()
            .filter({ gang: { name: gangName } } as any)
            .find();
    }

    /**
     * Find players who are on duty for a job
     */
    async findOnDuty(jobName: string): Promise<Player[]> {
        return this.query()
            .filter({ job: { name: jobName, onDuty: true } } as any)
            .find();
    }

    /**
     * Find banned players
     */
    async findBanned(): Promise<Player[]> {
        return this.query().filter({ isBanned: true }).find();
    }

    /**
     * Find players online recently (within minutes)
     */
    async findRecentlyOnline(minutes: number = 30): Promise<Player[]> {
        const threshold = new Date(Date.now() - minutes * 60 * 1000);
        return this.query()
            .filter({ lastSeen: { $gte: threshold } } as any)
            .find();
    }

    /**
     * Search players by name (partial match)
     */
    async searchByName(searchTerm: string): Promise<Player[]> {
        return this.query()
            .filter({ name: { $like: `%${searchTerm}%` } } as any)
            .find();
    }

    /**
     * Get top players by playtime
     */
    async getTopByPlaytime(limit: number = 10): Promise<Player[]> {
        return this.query()
            .orderBy('playtime', 'desc')
            .limit(limit)
            .find();
    }

    /**
     * Get top players by money
     */
    async getTopByMoney(type: keyof PlayerMoney, limit: number = 10): Promise<Player[]> {
        return this.query()
            .orderBy(`money.${type}` as any, 'desc')
            .limit(limit)
            .find();
    }

    /**
     * Add money to player account
     */
    async addMoney(playerId: string, type: keyof PlayerMoney, amount: number): Promise<boolean> {
        const player = await this.findById(playerId);
        if (!player) return false;

        player.addMoney(type, amount);
        await this.save(player);
        return true;
    }

    /**
     * Remove money from player account
     */
    async removeMoney(playerId: string, type: keyof PlayerMoney, amount: number): Promise<boolean> {
        const player = await this.findById(playerId);
        if (!player) return false;

        const success = player.removeMoney(type, amount);
        if (success) {
            await this.save(player);
        }
        return success;
    }

    /**
     * Transfer money between players
     */
    async transferMoney(
        fromPlayerId: string,
        toPlayerId: string,
        type: keyof PlayerMoney,
        amount: number
    ): Promise<boolean> {
        return this.transaction(async () => {
            const fromPlayer = await this.findById(fromPlayerId);
            const toPlayer = await this.findById(toPlayerId);

            if (!fromPlayer || !toPlayer) return false;

            if (!fromPlayer.removeMoney(type, amount)) return false;
            toPlayer.addMoney(type, amount);

            await this.saveMany([fromPlayer, toPlayer]);
            return true;
        });
    }

    /**
     * Ban player
     */
    async ban(playerId: string, reason: string, expiryDate?: Date): Promise<boolean> {
        const player = await this.findById(playerId);
        if (!player) return false;

        player.isBanned = true;
        player.banReason = reason;
        player.banExpiry = expiryDate;
        await this.save(player);
        return true;
    }

    /**
     * Unban player
     */
    async unban(playerId: string): Promise<boolean> {
        const player = await this.findById(playerId);
        if (!player) return false;

        player.isBanned = false;
        player.banReason = undefined;
        player.banExpiry = undefined;
        await this.save(player);
        return true;
    }

    /**
     * Check if license is banned
     */
    async isBanned(license: string): Promise<{ banned: boolean; reason?: string; expiry?: Date }> {
        const player = await this.findByLicense(license);
        if (!player) return { banned: false };

        const isBanned = player.checkBanned();
        if (isBanned) {
            // Save if ban status changed (expired)
            if (!player.isBanned) {
                await this.save(player);
            }
            return {
                banned: player.isBanned,
                reason: player.banReason,
                expiry: player.banExpiry,
            };
        }

        return { banned: false };
    }

    /**
     * Update player position
     */
    async updatePosition(
        playerId: string,
        position: { x: number; y: number; z: number; heading: number }
    ): Promise<boolean> {
        const player = await this.findById(playerId);
        if (!player) return false;

        player.position.x = position.x;
        player.position.y = position.y;
        player.position.z = position.z;
        player.position.heading = position.heading;
        await this.save(player);
        return true;
    }

    /**
     * Update player playtime
     */
    async addPlaytime(playerId: string, seconds: number): Promise<boolean> {
        const player = await this.findById(playerId);
        if (!player) return false;

        player.playtime += seconds;
        player.lastSeen = new Date();
        await this.save(player);
        return true;
    }

    /**
     * Set player job
     */
    async setJob(
        playerId: string,
        jobName: string,
        grade: { name: string; level: number; payment: number }
    ): Promise<boolean> {
        const player = await this.findById(playerId);
        if (!player) return false;

        player.jobName = jobName;
        player.jobLabel = jobName.charAt(0).toUpperCase() + jobName.slice(1);
        player.jobGradeName = grade.name;
        player.jobGradeLevel = grade.level;
        player.jobGradePayment = grade.payment;
        player.jobOnDuty = false;
        await this.save(player);
        return true;
    }

    /**
     * Toggle player duty status
     */
    async toggleDuty(playerId: string): Promise<boolean | null> {
        const player = await this.findById(playerId);
        if (!player) return null;

        player.jobOnDuty = !player.jobOnDuty;
        await this.save(player);
        return player.jobOnDuty;
    }

    /**
     * Get player statistics
     */
    async getStats(): Promise<{
        total: number;
        online: number;
        banned: number;
        newToday: number;
    }> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

        const [total, online, banned, newToday] = await Promise.all([
            this.count(),
            this.query().filter({ lastSeen: { $gte: thirtyMinutesAgo } } as any).count(),
            this.query().filter({ isBanned: true }).count(),
            this.query().filter({ createdAt: { $gte: today } } as any).count(),
        ]);

        return { total, online, banned, newToday };
    }
}
