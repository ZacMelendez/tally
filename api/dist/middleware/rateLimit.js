"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteRateLimit = exports.debtUpdateRateLimit = exports.debtAddRateLimit = exports.assetUpdateRateLimit = exports.assetAddRateLimit = exports.authRateLimit = exports.globalRateLimit = void 0;
exports.createRateLimitMiddleware = createRateLimitMiddleware;
exports.getRateLimitInfo = getRateLimitInfo;
exports.getRateLimitStats = getRateLimitStats;
const sqliteRateLimitService_1 = require("../services/sqliteRateLimitService");
function createRateLimitMiddleware(action, getIdentifier) {
    return async (request, reply) => {
        try {
            let identifier;
            if (getIdentifier) {
                identifier = getIdentifier(request);
            }
            else if (request.userId) {
                identifier = `user:${request.userId}`;
            }
            else {
                identifier = `ip:${request.ip}`;
            }
            const result = await sqliteRateLimitService_1.sqliteRateLimitService.checkRateLimit(action, identifier);
            request.rateLimitInfo = {
                action,
                identifier,
                success: result.success,
                limit: result.limit,
                remaining: result.remaining,
                reset: result.reset,
            };
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
        }
        catch (error) {
            console.error("Rate limiting error:", error);
            request.log.warn({ error, action, identifier: "unknown" }, "Rate limiting service error");
        }
    };
}
exports.globalRateLimit = createRateLimitMiddleware("global");
exports.authRateLimit = createRateLimitMiddleware("auth", (request) => `auth:${request.ip}`);
exports.assetAddRateLimit = createRateLimitMiddleware("add-asset");
exports.assetUpdateRateLimit = createRateLimitMiddleware("update-asset");
exports.debtAddRateLimit = createRateLimitMiddleware("add-debt");
exports.debtUpdateRateLimit = createRateLimitMiddleware("update-debt");
exports.deleteRateLimit = createRateLimitMiddleware("delete-item");
async function getRateLimitInfo(request, reply) {
    try {
        const userId = request.userId;
        if (!userId) {
            return reply.status(401).send({
                success: false,
                error: "Authentication required",
            });
        }
        const identifier = `user:${userId}`;
        const rateLimitInfo = {};
        for (const [action, config] of Object.entries(sqliteRateLimitService_1.RATE_LIMIT_CONFIGS)) {
            const status = await sqliteRateLimitService_1.sqliteRateLimitService.getRateLimitStatus(action, identifier);
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
    }
    catch (error) {
        console.error("Error getting rate limit info:", error);
        return reply.status(500).send({
            success: false,
            error: "Failed to get rate limit information",
        });
    }
}
async function getRateLimitStats(request, reply) {
    try {
        const stats = await sqliteRateLimitService_1.sqliteRateLimitService.getStats();
        return reply.send({
            success: true,
            data: {
                ...stats,
                timestamp: Date.now(),
                configs: sqliteRateLimitService_1.RATE_LIMIT_CONFIGS,
            },
        });
    }
    catch (error) {
        console.error("Error getting rate limit stats:", error);
        return reply.status(500).send({
            success: false,
            error: "Failed to get rate limit statistics",
        });
    }
}
//# sourceMappingURL=rateLimit.js.map