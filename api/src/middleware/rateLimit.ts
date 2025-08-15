import { FastifyRequest, FastifyReply } from "fastify";
import {
    sqliteRateLimitService,
    RateLimitAction,
    RATE_LIMIT_CONFIGS,
} from "../services/sqliteRateLimitService";

declare module "fastify" {
    interface FastifyRequest {
        rateLimitInfo?: {
            action: RateLimitAction;
            identifier: string;
            success: boolean;
            limit: number;
            remaining: number;
            reset: number;
        };
    }
}

/**
 * Rate limiting middleware factory
 * @param action - The action to rate limit
 * @param getIdentifier - Function to extract identifier from request (defaults to userId)
 */
export function createRateLimitMiddleware(
    action: RateLimitAction,
    getIdentifier?: (request: FastifyRequest) => string
) {
    return async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            // Get identifier (default to user ID if authenticated, fallback to IP)
            let identifier: string;
            if (getIdentifier) {
                identifier = getIdentifier(request);
            } else if (request.userId) {
                identifier = `user:${request.userId}`;
            } else {
                // Fallback to IP address for unauthenticated requests
                identifier = `ip:${request.ip}`;
            }

            // Check rate limit
            const result = await sqliteRateLimitService.checkRateLimit(
                action,
                identifier
            );

            // Store rate limit info in request for potential use by route handlers
            request.rateLimitInfo = {
                action,
                identifier,
                success: result.success,
                limit: result.limit,
                remaining: result.remaining,
                reset: result.reset,
            };

            // Set rate limit headers
            reply.header("X-RateLimit-Limit", result.limit.toString());
            reply.header("X-RateLimit-Remaining", result.remaining.toString());
            reply.header("X-RateLimit-Reset", result.reset.toString());

            if (!result.success) {
                if (result.retryAfter) {
                    reply.header("Retry-After", result.retryAfter.toString());
                }

                return reply.status(429).send({
                    success: false,
                    error: "Rate limit exceeded",
                    rateLimitInfo: {
                        limit: result.limit,
                        remaining: result.remaining,
                        reset: result.reset,
                        retryAfter: result.retryAfter,
                    },
                });
            }

            // Rate limit passed, continue to the next handler
        } catch (error) {
            // Log error but don't block request
            console.error("Rate limiting error:", error);

            // In case of rate limiting service failure, allow the request to proceed
            // but log the incident for monitoring
            request.log.warn(
                { error, action, identifier: "unknown" },
                "Rate limiting service error"
            );
        }
    };
}

/**
 * Global rate limiting middleware
 * Applies to all authenticated requests
 */
export const globalRateLimit = createRateLimitMiddleware("global");

/**
 * Auth rate limiting middleware
 * For authentication endpoints (if any are added)
 */
export const authRateLimit = createRateLimitMiddleware(
    "auth",
    (request) => `auth:${request.ip}` // Use IP for auth attempts
);

/**
 * Asset operation rate limiting
 */
export const assetAddRateLimit = createRateLimitMiddleware("add-asset");
export const assetUpdateRateLimit = createRateLimitMiddleware("update-asset");

/**
 * Debt operation rate limiting
 */
export const debtAddRateLimit = createRateLimitMiddleware("add-debt");
export const debtUpdateRateLimit = createRateLimitMiddleware("update-debt");

/**
 * Delete operation rate limiting (for both assets and debts)
 */
export const deleteRateLimit = createRateLimitMiddleware("delete-item");

/**
 * Rate limit info endpoint handler
 * Allows clients to check their current rate limit status
 */
export async function getRateLimitInfo(
    request: FastifyRequest,
    reply: FastifyReply
) {
    try {
        const userId = request.userId;
        if (!userId) {
            return reply.status(401).send({
                success: false,
                error: "Authentication required",
            });
        }

        const identifier = `user:${userId}`;
        const rateLimitInfo: Record<string, any> = {};

        // Get status for all rate limit actions
        for (const [action, config] of Object.entries(RATE_LIMIT_CONFIGS)) {
            const status = await sqliteRateLimitService.getRateLimitStatus(
                action as RateLimitAction,
                identifier
            );

            if (status) {
                rateLimitInfo[action] = {
                    ...status,
                    windowMs: config.windowMs,
                };
            }
        }

        return reply.send({
            success: true,
            data: {
                identifier,
                rateLimits: rateLimitInfo,
                timestamp: Date.now(),
            },
        });
    } catch (error) {
        console.error("Error getting rate limit info:", error);
        return reply.status(500).send({
            success: false,
            error: "Failed to get rate limit information",
        });
    }
}

/**
 * Rate limit stats endpoint (for monitoring/debugging)
 * Should be protected and only available to admins in production
 */
export async function getRateLimitStats(
    request: FastifyRequest,
    reply: FastifyReply
) {
    try {
        const stats = await sqliteRateLimitService.getStats();

        return reply.send({
            success: true,
            data: {
                ...stats,
                timestamp: Date.now(),
                configs: RATE_LIMIT_CONFIGS,
            },
        });
    } catch (error) {
        console.error("Error getting rate limit stats:", error);
        return reply.status(500).send({
            success: false,
            error: "Failed to get rate limit statistics",
        });
    }
}
