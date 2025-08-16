"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteRateLimit = exports.debtRateLimit = exports.assetRateLimit = exports.authRateLimit = exports.globalRateLimit = void 0;
exports.createRateLimitMiddleware = createRateLimitMiddleware;
exports.getRateLimitInfo = getRateLimitInfo;
const rateLimit_1 = require("../services/rateLimit");
function createRateLimitMiddleware(getIdentifier) {
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
            const result = await (0, rateLimit_1.checkRateLimit)(identifier);
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
        }
        catch (error) {
            console.error("Rate limiting error:", error);
            request.log.warn({ error, identifier: "unknown" }, "Rate limiting service error");
        }
    };
}
exports.globalRateLimit = createRateLimitMiddleware();
exports.authRateLimit = createRateLimitMiddleware((request) => `auth:${request.ip}`);
exports.assetRateLimit = createRateLimitMiddleware();
exports.debtRateLimit = createRateLimitMiddleware();
exports.deleteRateLimit = createRateLimitMiddleware();
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
        const result = await (0, rateLimit_1.checkRateLimit)(identifier);
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
    }
    catch (error) {
        console.error("Error getting rate limit info:", error);
        return reply.status(500).send({
            success: false,
            error: "Failed to get rate limit information",
        });
    }
}
//# sourceMappingURL=rateLimit.js.map