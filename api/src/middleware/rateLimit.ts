import { FastifyRequest, FastifyReply } from "fastify";
import { checkRateLimit } from "../services/rateLimit";

declare module "fastify" {
    interface FastifyRequest {
        rateLimitInfo?: {
            identifier: string;
            success: boolean;
            reason?: string;
        };
    }
}

/**
 * Rate limiting middleware factory
 * @param getIdentifier - Function to extract identifier from request (defaults to userId)
 */
export function createRateLimitMiddleware(
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
            const result = await checkRateLimit(identifier);

            // Store rate limit info in request for potential use by route handlers
            request.rateLimitInfo = {
                identifier,
                success: result.success,
                reason: result.reason,
            };

            if (!result.success) {
                return reply.status(429).send({
                    success: false,
                    error: "Rate limit exceeded",
                    message: result.reason || "Too many requests",
                });
            }

            // Rate limit passed, continue to the next handler
        } catch (error) {
            // Log error but don't block request
            console.error("Rate limiting error:", error);

            // In case of rate limiting service failure, allow the request to proceed
            // but log the incident for monitoring
            request.log.warn(
                { error, identifier: "unknown" },
                "Rate limiting service error"
            );
        }
    };
}

/**
 * Global rate limiting middleware
 * Applies to all authenticated requests
 */
export const globalRateLimit = createRateLimitMiddleware();

/**
 * Auth rate limiting middleware
 * For authentication endpoints (if any are added)
 */
export const authRateLimit = createRateLimitMiddleware(
    (request) => `auth:${request.ip}` // Use IP for auth attempts
);

/**
 * Asset operation rate limiting
 */
export const assetRateLimit = createRateLimitMiddleware();

/**
 * Debt operation rate limiting
 */
export const debtRateLimit = createRateLimitMiddleware();

/**
 * Delete operation rate limiting (for both assets and debts)
 */
export const deleteRateLimit = createRateLimitMiddleware();

/**
 * Rate limit info endpoint handler
 * Allows clients to check their current rate limit status
 * Note: With Upstash rate limiting, we can only check if a request would pass or fail
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

        // Check current rate limit status (this will consume one request)
        const result = await checkRateLimit(identifier);

        return reply.send({
            success: true,
            data: {
                identifier,
                rateLimitStatus: {
                    success: result.success,
                    reason: result.reason,
                    message: result.success
                        ? "Rate limit check passed"
                        : "Rate limit exceeded",
                },
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
