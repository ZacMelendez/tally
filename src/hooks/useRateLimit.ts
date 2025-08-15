import { useState, useCallback } from "react";
import { RateLimitState } from "../types";
import toast from "react-hot-toast";

const RATE_LIMITS = {
    "add-asset": { maxRequests: 10, windowMs: 60000 }, // 10 requests per minute
    "add-debt": { maxRequests: 10, windowMs: 60000 },
    "update-asset": { maxRequests: 20, windowMs: 60000 },
    "update-debt": { maxRequests: 20, windowMs: 60000 },
    "delete-item": { maxRequests: 15, windowMs: 60000 },
} as const;

type RateLimitAction = keyof typeof RATE_LIMITS;

export const useRateLimit = () => {
    const [rateLimitStates, setRateLimitStates] = useState<
        Map<RateLimitAction, RateLimitState>
    >(new Map());

    const checkRateLimit = useCallback(
        (action: RateLimitAction): boolean => {
            const limit = RATE_LIMITS[action];
            const now = Date.now();
            const state = rateLimitStates.get(action);

            if (!state) {
                // First request for this action
                setRateLimitStates((prev) =>
                    new Map(prev).set(action, {
                        count: 1,
                        resetTime: now + limit.windowMs,
                    })
                );
                return true;
            }

            if (now > state.resetTime) {
                // Reset window has passed
                setRateLimitStates((prev) =>
                    new Map(prev).set(action, {
                        count: 1,
                        resetTime: now + limit.windowMs,
                    })
                );
                return true;
            }

            if (state.count >= limit.maxRequests) {
                // Rate limit exceeded
                const remainingTime = Math.ceil((state.resetTime - now) / 1000);
                toast.error(
                    `Rate limit exceeded. Please wait ${remainingTime} seconds before trying again.`
                );
                return false;
            }

            // Increment count
            setRateLimitStates((prev) =>
                new Map(prev).set(action, {
                    ...state,
                    count: state.count + 1,
                })
            );
            return true;
        },
        [rateLimitStates]
    );

    return { checkRateLimit };
};
