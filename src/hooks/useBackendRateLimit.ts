import { useState, useCallback, useEffect } from "react";
import { toast } from "react-hot-toast";
import {
    backendRateLimitService,
    RateLimitAction,
    RateLimitData,
} from "../services/backendRateLimitService";

interface UseBackendRateLimitReturn {
    checkRateLimit: (action: RateLimitAction) => Promise<boolean>;
    getRateLimitInfo: () => Promise<RateLimitData | null>;
    isLoading: boolean;
    rateLimitInfo: RateLimitData | null;
    refreshRateLimitInfo: () => Promise<void>;
    isApproachingLimit: (
        action: RateLimitAction,
        threshold?: number
    ) => Promise<boolean>;
    getTimeUntilReset: (resetTime: number) => string;
}

export const useBackendRateLimit = (): UseBackendRateLimitReturn => {
    const [isLoading, setIsLoading] = useState(false);
    const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitData | null>(
        null
    );

    // Load initial rate limit info
    useEffect(() => {
        const loadInitialInfo = async () => {
            const info = await backendRateLimitService.getRateLimitInfo();
            if (info) {
                setRateLimitInfo(info);
            }
        };

        loadInitialInfo();
    }, []);

    const checkRateLimit = useCallback(
        async (action: RateLimitAction): Promise<boolean> => {
            setIsLoading(true);

            try {
                const quota = await backendRateLimitService.checkActionQuota(
                    action
                );

                if (!quota.allowed) {
                    const timeUntilReset =
                        backendRateLimitService.getTimeUntilReset(
                            quota.resetTime
                        );
                    toast.error(
                        `Rate limit exceeded for ${action.replace(
                            "-",
                            " "
                        )}. Try again in ${timeUntilReset}.`
                    );
                    return false;
                }

                // Update local rate limit info to reflect the usage
                const info = await backendRateLimitService.getRateLimitInfo();
                if (info) {
                    setRateLimitInfo(info);
                }

                return true;
            } catch (error) {
                console.error("Rate limit check error:", error);
                return true;
            } finally {
                setIsLoading(false);
            }
        },
        []
    );

    const getRateLimitInfo =
        useCallback(async (): Promise<RateLimitData | null> => {
            setIsLoading(true);

            try {
                const info = await backendRateLimitService.getRateLimitInfo();
                setRateLimitInfo(info);
                return info;
            } catch (error) {
                console.error("Error getting rate limit info:", error);
                return null;
            } finally {
                setIsLoading(false);
            }
        }, []);

    const refreshRateLimitInfo = useCallback(async (): Promise<void> => {
        // Clear cache and fetch fresh data
        backendRateLimitService.clearCache();
        await getRateLimitInfo();
    }, [getRateLimitInfo]);

    const isApproachingLimit = useCallback(
        async (
            action: RateLimitAction,
            threshold?: number
        ): Promise<boolean> => {
            return backendRateLimitService.isApproachingLimit(
                action,
                threshold
            );
        },
        []
    );

    const getTimeUntilReset = useCallback((resetTime: number): string => {
        return backendRateLimitService.getTimeUntilReset(resetTime);
    }, []);

    return {
        checkRateLimit,
        getRateLimitInfo,
        isLoading,
        rateLimitInfo,
        refreshRateLimitInfo,
        isApproachingLimit,
        getTimeUntilReset,
    };
};
