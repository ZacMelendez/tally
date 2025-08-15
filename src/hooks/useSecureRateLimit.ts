import { useState, useCallback, useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";
import {
    rateLimitService,
    type RateLimitAction,
} from "../services/rateLimitService";
import toast from "react-hot-toast";

interface RateLimitResult {
    success: boolean;
    limit: number;
    remaining: number;
    reset: number;
    retryAfter?: number;
}

interface UseSecureRateLimitReturn {
    checkRateLimit: (action: RateLimitAction) => Promise<boolean>;
    getRateLimitStatus: (
        action: RateLimitAction
    ) => Promise<RateLimitResult | null>;
    resetRateLimit: (action: RateLimitAction) => Promise<boolean>;
    isLoading: boolean;
}

export const useSecureRateLimit = (): UseSecureRateLimitReturn => {
    const [isLoading, setIsLoading] = useState(false);
    const context = useContext(AuthContext);
    const currentUser = context?.currentUser;

    /**
     * Generate a unique identifier for rate limiting
     * Uses user ID if available, falls back to a browser fingerprint
     */
    const getIdentifier = useCallback((): string => {
        if (currentUser?.id) {
            return `user:${currentUser.id}`;
        }

        // Fallback to browser fingerprint for anonymous users
        const fingerprint = [
            navigator.userAgent,
            navigator.language,
            new Date().getTimezoneOffset(),
            screen.width,
            screen.height,
        ].join("|");

        // Simple hash function for fingerprint
        let hash = 0;
        for (let i = 0; i < fingerprint.length; i++) {
            const char = fingerprint.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash = hash & hash; // Convert to 32-bit integer
        }

        return `anon:${Math.abs(hash)}`;
    }, [currentUser]);

    /**
     * Check if an action is rate limited
     * Returns true if the action is allowed, false if rate limited
     */
    const checkRateLimit = useCallback(
        async (action: RateLimitAction): Promise<boolean> => {
            setIsLoading(true);

            try {
                const identifier = getIdentifier();
                const result = await rateLimitService.checkRateLimit(
                    action,
                    identifier
                );

                if (!result.success) {
                    const retryAfter = result.retryAfter || 60;
                    const minutes = Math.floor(retryAfter / 60);
                    const seconds = retryAfter % 60;

                    let timeMessage = "";
                    if (minutes > 0) {
                        timeMessage = `${minutes} minute${
                            minutes > 1 ? "s" : ""
                        }`;
                        if (seconds > 0) {
                            timeMessage += ` and ${seconds} second${
                                seconds > 1 ? "s" : ""
                            }`;
                        }
                    } else {
                        timeMessage = `${seconds} second${
                            seconds > 1 ? "s" : ""
                        }`;
                    }

                    toast.error(
                        `Rate limit exceeded. Please wait ${timeMessage} before trying again.`,
                        {
                            duration: 5000,
                            id: `ratelimit-${action}`, // Prevent duplicate toasts
                        }
                    );

                    return false;
                }

                return true;
            } catch (error) {
                console.error("Rate limit check failed:", error);
                // In case of error, allow the request but log it
                toast.error(
                    "Rate limiting service unavailable. Request allowed."
                );
                return true;
            } finally {
                setIsLoading(false);
            }
        },
        [getIdentifier]
    );

    /**
     * Get current rate limit status without consuming a request
     */
    const getRateLimitStatus = useCallback(
        async (action: RateLimitAction): Promise<RateLimitResult | null> => {
            try {
                const identifier = getIdentifier();
                const result = await rateLimitService.checkRateLimit(
                    action,
                    identifier
                );
                return result;
            } catch (error) {
                console.error("Failed to get rate limit status:", error);
                return null;
            }
        },
        [getIdentifier]
    );

    /**
     * Reset rate limit for current user (admin function)
     */
    const resetRateLimit = useCallback(
        async (action: RateLimitAction): Promise<boolean> => {
            try {
                const identifier = getIdentifier();
                const success = await rateLimitService.resetRateLimit(
                    action,
                    identifier
                );

                if (success) {
                    toast.success(`Rate limit reset for ${action}`);
                } else {
                    toast.error("Failed to reset rate limit");
                }

                return success;
            } catch (error) {
                console.error("Failed to reset rate limit:", error);
                toast.error("Failed to reset rate limit");
                return false;
            }
        },
        [getIdentifier]
    );

    return {
        checkRateLimit,
        getRateLimitStatus,
        resetRateLimit,
        isLoading,
    };
};

// Helper hook for global rate limiting
export const useGlobalRateLimit = () => {
    const { checkRateLimit } = useSecureRateLimit();

    return useCallback(async (): Promise<boolean> => {
        return await checkRateLimit("global");
    }, [checkRateLimit]);
};
