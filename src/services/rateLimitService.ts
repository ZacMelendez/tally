import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { rateLimitMonitor } from "./rateLimitMonitorService";

// Rate limit configurations for different actions
const RATE_LIMIT_CONFIGS = {
    "add-asset": { requests: 10, window: "60 s" },
    "add-debt": { requests: 10, window: "60 s" },
    "update-asset": { requests: 20, window: "60 s" },
    "update-debt": { requests: 20, window: "60 s" },
    "delete-item": { requests: 15, window: "60 s" },
    auth: { requests: 5, window: "300 s" }, // 5 auth attempts per 5 minutes
    global: { requests: 100, window: "60 s" }, // Global per-user limit
} as const;

export type RateLimitAction = keyof typeof RATE_LIMIT_CONFIGS;

class RateLimitService {
    private redis: Redis | null = null;
    private ratelimiters: Map<RateLimitAction, Ratelimit> = new Map();
    private cache = new Map(); // In-memory cache for performance
    private isInitialized = false;

    constructor() {
        this.initializeRedis();
    }

    private initializeRedis() {
        try {
            // Check if we have the required environment variables
            const redisUrl = import.meta.env.VITE_UPSTASH_REDIS_REST_URL;
            const redisToken = import.meta.env.VITE_UPSTASH_REDIS_REST_TOKEN;

            if (!redisUrl || !redisToken) {
                console.warn(
                    "Upstash Redis credentials not found. Rate limiting will use fallback mode."
                );
                return;
            }

            this.redis = new Redis({
                url: redisUrl,
                token: redisToken,
            });

            // Initialize rate limiters for each action
            Object.entries(RATE_LIMIT_CONFIGS).forEach(([action, config]) => {
                const ratelimiter = new Ratelimit({
                    redis: this.redis!,
                    limiter: Ratelimit.slidingWindow(
                        config.requests,
                        config.window
                    ),
                    analytics: true,
                    ephemeralCache: this.cache,
                    timeout: 1000, // 1 second timeout
                    prefix: `ratelimit:${action}`,
                });

                this.ratelimiters.set(action as RateLimitAction, ratelimiter);
            });

            this.isInitialized = true;
            console.log("Upstash rate limiting initialized successfully");
        } catch (error) {
            console.error("Failed to initialize Upstash Redis:", error);
            this.isInitialized = false;
        }
    }

    /**
     * Check if an action is rate limited for a given identifier
     * @param action - The action being performed
     * @param identifier - Unique identifier (user ID, IP, etc.)
     * @returns Promise resolving to rate limit result
     */
    async checkRateLimit(
        action: RateLimitAction,
        identifier: string
    ): Promise<{
        success: boolean;
        limit: number;
        remaining: number;
        reset: number;
        retryAfter?: number;
    }> {
        const startTime = Date.now();
        let error: Error | undefined;
        let result: any;

        try {
            // Check if we're forced into fallback mode
            const forceFallback =
                localStorage.getItem("force_rate_limit_fallback") === "true";

            // If Redis is not initialized or we're in fallback mode, use fallback logic
            if (!this.isInitialized || !this.redis || forceFallback) {
                result = this.fallbackRateLimit(action, identifier);
                rateLimitMonitor.recordOperation(
                    action,
                    identifier,
                    result.success,
                    Date.now() - startTime
                );
                return result;
            }

            const ratelimiter = this.ratelimiters.get(action);
            if (!ratelimiter) {
                console.warn(`No rate limiter found for action: ${action}`);
                result = {
                    success: true,
                    limit: 0,
                    remaining: 0,
                    reset: 0,
                };
                rateLimitMonitor.recordOperation(
                    action,
                    identifier,
                    result.success,
                    Date.now() - startTime
                );
                return result;
            }

            const upstashResult = await ratelimiter.limit(identifier);

            result = {
                success: upstashResult.success,
                limit: upstashResult.limit,
                remaining: upstashResult.remaining,
                reset: upstashResult.reset,
                retryAfter: upstashResult.success
                    ? undefined
                    : Math.ceil((upstashResult.reset - Date.now()) / 1000),
            };

            // Record successful operation
            rateLimitMonitor.recordOperation(
                action,
                identifier,
                result.success,
                Date.now() - startTime
            );
            return result;
        } catch (err) {
            error = err instanceof Error ? err : new Error(String(err));
            console.error("Rate limit check failed:", error);

            // In case of error, allow the request but log the issue
            result = {
                success: true,
                limit: 0,
                remaining: 0,
                reset: 0,
            };

            // Record failed operation
            rateLimitMonitor.recordOperation(
                action,
                identifier,
                false,
                Date.now() - startTime,
                error
            );
            return result;
        }
    }

    /**
     * Fallback rate limiting using local storage (less secure but better than nothing)
     */
    private fallbackRateLimit(
        action: RateLimitAction,
        identifier: string
    ): {
        success: boolean;
        limit: number;
        remaining: number;
        reset: number;
        retryAfter?: number;
    } {
        const config = RATE_LIMIT_CONFIGS[action];
        const key = `fallback_ratelimit_${action}_${identifier}`;
        const now = Date.now();

        // Parse window to milliseconds
        const windowMs = this.parseWindowToMs(config.window);

        try {
            const stored = localStorage.getItem(key);
            const data = stored ? JSON.parse(stored) : null;

            if (!data || now > data.resetTime) {
                // First request or window expired
                const newData = {
                    count: 1,
                    resetTime: now + windowMs,
                };
                localStorage.setItem(key, JSON.stringify(newData));

                return {
                    success: true,
                    limit: config.requests,
                    remaining: config.requests - 1,
                    reset: newData.resetTime,
                };
            }

            if (data.count >= config.requests) {
                // Rate limit exceeded
                return {
                    success: false,
                    limit: config.requests,
                    remaining: 0,
                    reset: data.resetTime,
                    retryAfter: Math.ceil((data.resetTime - now) / 1000),
                };
            }

            // Increment count
            data.count++;
            localStorage.setItem(key, JSON.stringify(data));

            return {
                success: true,
                limit: config.requests,
                remaining: config.requests - data.count,
                reset: data.resetTime,
            };
        } catch (error) {
            console.error("Fallback rate limiting failed:", error);
            // If even fallback fails, allow the request
            return {
                success: true,
                limit: config.requests,
                remaining: config.requests,
                reset: now + windowMs,
            };
        }
    }

    /**
     * Parse window string to milliseconds
     */
    private parseWindowToMs(window: string): number {
        const match = window.match(/^(\d+)\s*([smhd])$/);
        if (!match) return 60000; // Default to 1 minute

        const [, value, unit] = match;
        const num = parseInt(value, 10);

        switch (unit) {
            case "s":
                return num * 1000;
            case "m":
                return num * 60 * 1000;
            case "h":
                return num * 60 * 60 * 1000;
            case "d":
                return num * 24 * 60 * 60 * 1000;
            default:
                return 60000;
        }
    }

    /**
     * Reset rate limit for a specific action and identifier (admin function)
     */
    async resetRateLimit(
        action: RateLimitAction,
        identifier: string
    ): Promise<boolean> {
        try {
            if (!this.isInitialized || !this.redis) {
                // Clear from localStorage for fallback
                const key = `fallback_ratelimit_${action}_${identifier}`;
                localStorage.removeItem(key);
                return true;
            }

            const ratelimiter = this.ratelimiters.get(action);
            if (!ratelimiter) return false;

            await ratelimiter.reset(identifier);
            return true;
        } catch (error) {
            console.error("Failed to reset rate limit:", error);
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
        try {
            if (!this.isInitialized || !this.redis) {
                return null;
            }

            const ratelimiter = this.ratelimiters.get(action);
            if (!ratelimiter) return null;

            // This is a bit of a hack since Upstash doesn't have a "peek" method
            // We'll use the limit method and then reset if it was successful
            const result = await ratelimiter.limit(identifier);

            if (result.success && result.remaining < result.limit - 1) {
                // Reset the counter if we just incremented it
                await ratelimiter.reset(identifier);
                // And then increment it back to the previous value
                for (let i = 0; i < result.limit - result.remaining - 1; i++) {
                    await ratelimiter.limit(identifier);
                }
            }

            return {
                limit: result.limit,
                remaining: result.remaining + (result.success ? 1 : 0),
                reset: result.reset,
            };
        } catch (error) {
            console.error("Failed to get rate limit status:", error);
            return null;
        }
    }
}

// Export a singleton instance
export const rateLimitService = new RateLimitService();
