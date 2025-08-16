import { apiService } from "./apiService";

export interface RateLimitInfo {
    success: boolean;
    limit: number;
    remaining: number;
    reset: number;
    retryAfter?: number;
}

export interface RateLimitStatus {
    [action: string]: {
        limit: number;
        remaining: number;
        reset: number;
        windowMs: number;
    };
}

export interface RateLimitData {
    identifier: string;
    rateLimits: RateLimitStatus;
    timestamp: number;
}

// Rate limit actions that match the backend
export type RateLimitAction =
    | "add-asset"
    | "add-debt"
    | "update-asset"
    | "update-debt"
    | "delete-item"
    | "auth"
    | "global";

class BackendRateLimitService {
    private cache: Map<string, { data: RateLimitData; expires: number }> =
        new Map();
    private readonly CACHE_TTL = 5000; // 5 seconds cache

    /**
     * Get current rate limit status for all actions
     */
    async getRateLimitInfo(): Promise<RateLimitData | null> {
        try {
            const cacheKey = "rate-limit-info";
            const cached = this.cache.get(cacheKey);

            if (cached && Date.now() < cached.expires) {
                return cached.data;
            }

            const response = await apiService.request<RateLimitData>(
                "/rate-limit/info"
            );

            if (response.success && response.data) {
                // Cache the result
                this.cache.set(cacheKey, {
                    data: response.data,
                    expires: Date.now() + this.CACHE_TTL,
                });

                return response.data;
            }

            return null;
        } catch (error) {
            console.error("Failed to get rate limit info:", error);
            return null;
        }
    }

    /**
     * Check if a specific action has remaining quota
     */
    async checkActionQuota(action: RateLimitAction): Promise<{
        allowed: boolean;
        remaining: number;
        resetTime: number;
        retryAfter?: number;
    }> {
        try {
            const info = await this.getRateLimitInfo();

            if (!info || !info.rateLimits[action]) {
                // If we can't get rate limit info, allow the request
                // The backend will handle the actual rate limiting
                return {
                    allowed: true,
                    remaining: 1,
                    resetTime: Date.now() + 60000,
                };
            }

            const actionInfo = info.rateLimits[action];
            const now = Date.now();

            // Check if we're past the reset time
            if (now >= actionInfo.reset) {
                return {
                    allowed: true,
                    remaining: actionInfo.limit - 1,
                    resetTime: now + actionInfo.windowMs,
                };
            }

            // Check if we have remaining quota
            if (actionInfo.remaining > 0) {
                return {
                    allowed: true,
                    remaining: actionInfo.remaining - 1,
                    resetTime: actionInfo.reset,
                };
            }

            // Rate limit exceeded
            const retryAfter = Math.ceil((actionInfo.reset - now) / 1000);
            return {
                allowed: false,
                remaining: 0,
                resetTime: actionInfo.reset,
                retryAfter,
            };
        } catch (error) {
            console.error("Error checking action quota:", error);
            // In case of error, allow the request and let backend handle it
            return {
                allowed: true,
                remaining: 1,
                resetTime: Date.now() + 60000,
            };
        }
    }

    /**
     * Clear cache (useful for testing or when user logs out)
     */
    clearCache() {
        this.cache.clear();
    }

    /**
     * Get cached rate limit info without making API call
     */
    getCachedInfo(): RateLimitData | null {
        const cached = this.cache.get("rate-limit-info");
        if (cached && Date.now() < cached.expires) {
            return cached.data;
        }
        return null;
    }

    /**
     * Check if we're approaching rate limits for an action
     */
    async isApproachingLimit(
        action: RateLimitAction,
        threshold: number = 0.8
    ): Promise<boolean> {
        try {
            const info = await this.getRateLimitInfo();
            if (!info || !info.rateLimits[action]) {
                return false;
            }

            const actionInfo = info.rateLimits[action];
            const usageRatio =
                (actionInfo.limit - actionInfo.remaining) / actionInfo.limit;

            return usageRatio >= threshold;
        } catch (error) {
            console.error("Error checking rate limit threshold:", error);
            return false;
        }
    }

    /**
     * Get human-readable time until reset
     */
    getTimeUntilReset(resetTime: number): string {
        const now = Date.now();
        const diff = resetTime - now;

        if (diff <= 0) {
            return "Now";
        }

        const seconds = Math.ceil(diff / 1000);

        if (seconds < 60) {
            return `${seconds} second${seconds !== 1 ? "s" : ""}`;
        }

        const minutes = Math.ceil(seconds / 60);
        return `${minutes} minute${minutes !== 1 ? "s" : ""}`;
    }
}

// Export singleton instance
export const backendRateLimitService = new BackendRateLimitService();
