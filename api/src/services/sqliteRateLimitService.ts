import Database from "better-sqlite3";
import { join } from "path";

export interface RateLimitResult {
    success: boolean;
    limit: number;
    remaining: number;
    reset: number;
    retryAfter?: number;
}

export interface RateLimitConfig {
    requests: number;
    windowMs: number;
}

// Rate limit configurations for different actions
export const RATE_LIMIT_CONFIGS: Record<string, RateLimitConfig> = {
    "add-asset": { requests: 10, windowMs: 60 * 1000 }, // 10 requests per minute
    "add-debt": { requests: 10, windowMs: 60 * 1000 },
    "update-asset": { requests: 20, windowMs: 60 * 1000 },
    "update-debt": { requests: 20, windowMs: 60 * 1000 },
    "delete-item": { requests: 15, windowMs: 60 * 1000 },
    auth: { requests: 5, windowMs: 5 * 60 * 1000 }, // 5 auth attempts per 5 minutes
    global: { requests: 100, windowMs: 60 * 1000 }, // Global per-user limit
} as const;

export type RateLimitAction = keyof typeof RATE_LIMIT_CONFIGS;

export class SQLiteRateLimitService {
    private db: Database.Database;
    private initialized = false;

    constructor(dbPath?: string) {
        const path = dbPath || join(process.cwd(), "data", "rate_limits.db");
        this.db = new Database(path);
        this.initializeDatabase();
    }

    private initializeDatabase() {
        try {
            // Create directory if it doesn't exist
            const fs = require("fs");
            const path = require("path");
            const dir = path.dirname(this.db.name);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            // Create table for storing rate limit data
            this.db.exec(`
                CREATE TABLE IF NOT EXISTS rate_limits (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    identifier TEXT NOT NULL,
                    action TEXT NOT NULL,
                    count INTEGER NOT NULL DEFAULT 1,
                    window_start INTEGER NOT NULL,
                    window_end INTEGER NOT NULL,
                    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
                    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
                    UNIQUE(identifier, action, window_start)
                );
            `);

            // Create index for better performance
            this.db.exec(`
                CREATE INDEX IF NOT EXISTS idx_rate_limits_lookup 
                ON rate_limits(identifier, action, window_end);
            `);

            // Create index for cleanup
            this.db.exec(`
                CREATE INDEX IF NOT EXISTS idx_rate_limits_window_end 
                ON rate_limits(window_end);
            `);

            this.initialized = true;
            console.log("SQLite rate limiting database initialized");

            // Start cleanup process
            this.startCleanupProcess();
        } catch (error) {
            console.error(
                "Failed to initialize SQLite rate limiting database:",
                error
            );
            throw error;
        }
    }

    private startCleanupProcess() {
        // Clean up expired entries every 5 minutes
        setInterval(() => {
            this.cleanupExpiredEntries();
        }, 5 * 60 * 1000);
    }

    private cleanupExpiredEntries() {
        try {
            const now = Date.now();
            const deleteStmt = this.db.prepare(
                "DELETE FROM rate_limits WHERE window_end < ?"
            );
            const result = deleteStmt.run(now);

            if (result.changes > 0) {
                console.log(
                    `Cleaned up ${result.changes} expired rate limit entries`
                );
            }
        } catch (error) {
            console.error(
                "Error cleaning up expired rate limit entries:",
                error
            );
        }
    }

    /**
     * Check if an action is rate limited for a given identifier
     */
    async checkRateLimit(
        action: RateLimitAction,
        identifier: string
    ): Promise<RateLimitResult> {
        if (!this.initialized) {
            throw new Error("SQLite rate limit service not initialized");
        }

        const config = RATE_LIMIT_CONFIGS[action];
        if (!config) {
            throw new Error(
                `No rate limit configuration found for action: ${action}`
            );
        }

        const now = Date.now();
        const windowStart = now;
        const windowEnd = now + config.windowMs;

        try {
            // Clean up expired entries for this identifier/action first
            const cleanupStmt = this.db.prepare(
                "DELETE FROM rate_limits WHERE identifier = ? AND action = ? AND window_end < ?"
            );
            cleanupStmt.run(identifier, action, now);

            // Get current count for active windows
            const countStmt = this.db.prepare(`
                SELECT SUM(count) as total_count, MIN(window_end) as earliest_reset
                FROM rate_limits 
                WHERE identifier = ? AND action = ? AND window_end > ?
            `);
            const result = countStmt.get(identifier, action, now) as {
                total_count: number | null;
                earliest_reset: number | null;
            };

            const currentCount = result.total_count || 0;
            const earliestReset = result.earliest_reset || windowEnd;

            // Check if limit is exceeded
            if (currentCount >= config.requests) {
                const retryAfter = Math.ceil((earliestReset - now) / 1000);
                return {
                    success: false,
                    limit: config.requests,
                    remaining: 0,
                    reset: earliestReset,
                    retryAfter,
                };
            }

            // Insert or increment counter for current window
            const insertStmt = this.db.prepare(`
                INSERT INTO rate_limits (identifier, action, count, window_start, window_end, updated_at)
                VALUES (?, ?, 1, ?, ?, strftime('%s', 'now'))
                ON CONFLICT(identifier, action, window_start) 
                DO UPDATE SET 
                    count = count + 1,
                    updated_at = strftime('%s', 'now')
            `);

            insertStmt.run(identifier, action, windowStart, windowEnd);

            // Calculate remaining requests
            const remaining = Math.max(0, config.requests - (currentCount + 1));

            return {
                success: true,
                limit: config.requests,
                remaining,
                reset: windowEnd,
            };
        } catch (error) {
            console.error("Error checking rate limit:", error);
            // In case of database error, allow the request but log the error
            return {
                success: true,
                limit: config.requests,
                remaining: config.requests - 1,
                reset: windowEnd,
            };
        }
    }

    /**
     * Reset rate limit for a specific action and identifier
     */
    async resetRateLimit(
        action: RateLimitAction,
        identifier: string
    ): Promise<boolean> {
        if (!this.initialized) {
            return false;
        }

        try {
            const deleteStmt = this.db.prepare(
                "DELETE FROM rate_limits WHERE identifier = ? AND action = ?"
            );
            const result = deleteStmt.run(identifier, action);
            return result.changes > 0;
        } catch (error) {
            console.error("Error resetting rate limit:", error);
            return false;
        }
    }

    /**
     * Get rate limit status without incrementing the counter
     */
    async getRateLimitStatus(
        action: RateLimitAction,
        identifier: string
    ): Promise<{
        limit: number;
        remaining: number;
        reset: number;
    } | null> {
        if (!this.initialized) {
            return null;
        }

        const config = RATE_LIMIT_CONFIGS[action];
        if (!config) {
            return null;
        }

        const now = Date.now();

        try {
            // Clean up expired entries first
            const cleanupStmt = this.db.prepare(
                "DELETE FROM rate_limits WHERE identifier = ? AND action = ? AND window_end < ?"
            );
            cleanupStmt.run(identifier, action, now);

            // Get current count
            const countStmt = this.db.prepare(`
                SELECT SUM(count) as total_count, MIN(window_end) as earliest_reset
                FROM rate_limits 
                WHERE identifier = ? AND action = ? AND window_end > ?
            `);
            const result = countStmt.get(identifier, action, now) as {
                total_count: number | null;
                earliest_reset: number | null;
            };

            const currentCount = result.total_count || 0;
            const reset = result.earliest_reset || now + config.windowMs;

            return {
                limit: config.requests,
                remaining: Math.max(0, config.requests - currentCount),
                reset,
            };
        } catch (error) {
            console.error("Error getting rate limit status:", error);
            return null;
        }
    }

    /**
     * Get statistics about rate limiting
     */
    async getStats(): Promise<{
        totalEntries: number;
        entriesByAction: Record<string, number>;
        oldestEntry: number | null;
    }> {
        if (!this.initialized) {
            return {
                totalEntries: 0,
                entriesByAction: {},
                oldestEntry: null,
            };
        }

        try {
            // Get total entries
            const totalStmt = this.db.prepare(
                "SELECT COUNT(*) as count FROM rate_limits"
            );
            const totalResult = totalStmt.get() as { count: number };

            // Get entries by action
            const actionStmt = this.db.prepare(`
                SELECT action, COUNT(*) as count 
                FROM rate_limits 
                GROUP BY action
            `);
            const actionResults = actionStmt.all() as {
                action: string;
                count: number;
            }[];

            const entriesByAction: Record<string, number> = {};
            actionResults.forEach((row) => {
                entriesByAction[row.action] = row.count;
            });

            // Get oldest entry
            const oldestStmt = this.db.prepare(
                "SELECT MIN(created_at) as oldest FROM rate_limits"
            );
            const oldestResult = oldestStmt.get() as { oldest: number | null };

            return {
                totalEntries: totalResult.count,
                entriesByAction,
                oldestEntry: oldestResult.oldest,
            };
        } catch (error) {
            console.error("Error getting rate limit stats:", error);
            return {
                totalEntries: 0,
                entriesByAction: {},
                oldestEntry: null,
            };
        }
    }

    /**
     * Close the database connection
     */
    close() {
        if (this.db) {
            this.db.close();
        }
    }
}

// Export singleton instance
export const sqliteRateLimitService = new SQLiteRateLimitService();

// Graceful shutdown
process.on("SIGINT", () => {
    sqliteRateLimitService.close();
    process.exit(0);
});

process.on("SIGTERM", () => {
    sqliteRateLimitService.close();
    process.exit(0);
});
