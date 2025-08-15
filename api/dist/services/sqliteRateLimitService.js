"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sqliteRateLimitService = exports.SQLiteRateLimitService = exports.RATE_LIMIT_CONFIGS = void 0;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const path_1 = require("path");
exports.RATE_LIMIT_CONFIGS = {
    "add-asset": { requests: 10, windowMs: 60 * 1000 },
    "add-debt": { requests: 10, windowMs: 60 * 1000 },
    "update-asset": { requests: 20, windowMs: 60 * 1000 },
    "update-debt": { requests: 20, windowMs: 60 * 1000 },
    "delete-item": { requests: 15, windowMs: 60 * 1000 },
    auth: { requests: 5, windowMs: 5 * 60 * 1000 },
    global: { requests: 100, windowMs: 60 * 1000 },
};
class SQLiteRateLimitService {
    db;
    initialized = false;
    constructor(dbPath) {
        const path = dbPath || (0, path_1.join)(process.cwd(), "data", "rate_limits.db");
        this.db = new better_sqlite3_1.default(path);
        this.initializeDatabase();
    }
    initializeDatabase() {
        try {
            const fs = require("fs");
            const path = require("path");
            const dir = path.dirname(this.db.name);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
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
            this.db.exec(`
                CREATE INDEX IF NOT EXISTS idx_rate_limits_lookup 
                ON rate_limits(identifier, action, window_end);
            `);
            this.db.exec(`
                CREATE INDEX IF NOT EXISTS idx_rate_limits_window_end 
                ON rate_limits(window_end);
            `);
            this.initialized = true;
            console.log("SQLite rate limiting database initialized");
            this.startCleanupProcess();
        }
        catch (error) {
            console.error("Failed to initialize SQLite rate limiting database:", error);
            throw error;
        }
    }
    startCleanupProcess() {
        setInterval(() => {
            this.cleanupExpiredEntries();
        }, 5 * 60 * 1000);
    }
    cleanupExpiredEntries() {
        try {
            const now = Date.now();
            const deleteStmt = this.db.prepare("DELETE FROM rate_limits WHERE window_end < ?");
            const result = deleteStmt.run(now);
            if (result.changes > 0) {
                console.log(`Cleaned up ${result.changes} expired rate limit entries`);
            }
        }
        catch (error) {
            console.error("Error cleaning up expired rate limit entries:", error);
        }
    }
    async checkRateLimit(action, identifier) {
        if (!this.initialized) {
            throw new Error("SQLite rate limit service not initialized");
        }
        const config = exports.RATE_LIMIT_CONFIGS[action];
        if (!config) {
            throw new Error(`No rate limit configuration found for action: ${action}`);
        }
        const now = Date.now();
        const windowStart = now;
        const windowEnd = now + config.windowMs;
        try {
            const cleanupStmt = this.db.prepare("DELETE FROM rate_limits WHERE identifier = ? AND action = ? AND window_end < ?");
            cleanupStmt.run(identifier, action, now);
            const countStmt = this.db.prepare(`
                SELECT SUM(count) as total_count, MIN(window_end) as earliest_reset
                FROM rate_limits 
                WHERE identifier = ? AND action = ? AND window_end > ?
            `);
            const result = countStmt.get(identifier, action, now);
            const currentCount = result.total_count || 0;
            const earliestReset = result.earliest_reset || windowEnd;
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
            const insertStmt = this.db.prepare(`
                INSERT INTO rate_limits (identifier, action, count, window_start, window_end, updated_at)
                VALUES (?, ?, 1, ?, ?, strftime('%s', 'now'))
                ON CONFLICT(identifier, action, window_start) 
                DO UPDATE SET 
                    count = count + 1,
                    updated_at = strftime('%s', 'now')
            `);
            insertStmt.run(identifier, action, windowStart, windowEnd);
            const remaining = Math.max(0, config.requests - (currentCount + 1));
            return {
                success: true,
                limit: config.requests,
                remaining,
                reset: windowEnd,
            };
        }
        catch (error) {
            console.error("Error checking rate limit:", error);
            return {
                success: true,
                limit: config.requests,
                remaining: config.requests - 1,
                reset: windowEnd,
            };
        }
    }
    async resetRateLimit(action, identifier) {
        if (!this.initialized) {
            return false;
        }
        try {
            const deleteStmt = this.db.prepare("DELETE FROM rate_limits WHERE identifier = ? AND action = ?");
            const result = deleteStmt.run(identifier, action);
            return result.changes > 0;
        }
        catch (error) {
            console.error("Error resetting rate limit:", error);
            return false;
        }
    }
    async getRateLimitStatus(action, identifier) {
        if (!this.initialized) {
            return null;
        }
        const config = exports.RATE_LIMIT_CONFIGS[action];
        if (!config) {
            return null;
        }
        const now = Date.now();
        try {
            const cleanupStmt = this.db.prepare("DELETE FROM rate_limits WHERE identifier = ? AND action = ? AND window_end < ?");
            cleanupStmt.run(identifier, action, now);
            const countStmt = this.db.prepare(`
                SELECT SUM(count) as total_count, MIN(window_end) as earliest_reset
                FROM rate_limits 
                WHERE identifier = ? AND action = ? AND window_end > ?
            `);
            const result = countStmt.get(identifier, action, now);
            const currentCount = result.total_count || 0;
            const reset = result.earliest_reset || now + config.windowMs;
            return {
                limit: config.requests,
                remaining: Math.max(0, config.requests - currentCount),
                reset,
            };
        }
        catch (error) {
            console.error("Error getting rate limit status:", error);
            return null;
        }
    }
    async getStats() {
        if (!this.initialized) {
            return {
                totalEntries: 0,
                entriesByAction: {},
                oldestEntry: null,
            };
        }
        try {
            const totalStmt = this.db.prepare("SELECT COUNT(*) as count FROM rate_limits");
            const totalResult = totalStmt.get();
            const actionStmt = this.db.prepare(`
                SELECT action, COUNT(*) as count 
                FROM rate_limits 
                GROUP BY action
            `);
            const actionResults = actionStmt.all();
            const entriesByAction = {};
            actionResults.forEach((row) => {
                entriesByAction[row.action] = row.count;
            });
            const oldestStmt = this.db.prepare("SELECT MIN(created_at) as oldest FROM rate_limits");
            const oldestResult = oldestStmt.get();
            return {
                totalEntries: totalResult.count,
                entriesByAction,
                oldestEntry: oldestResult.oldest,
            };
        }
        catch (error) {
            console.error("Error getting rate limit stats:", error);
            return {
                totalEntries: 0,
                entriesByAction: {},
                oldestEntry: null,
            };
        }
    }
    close() {
        if (this.db) {
            this.db.close();
        }
    }
}
exports.SQLiteRateLimitService = SQLiteRateLimitService;
exports.sqliteRateLimitService = new SQLiteRateLimitService();
process.on("SIGINT", () => {
    exports.sqliteRateLimitService.close();
    process.exit(0);
});
process.on("SIGTERM", () => {
    exports.sqliteRateLimitService.close();
    process.exit(0);
});
//# sourceMappingURL=sqliteRateLimitService.js.map