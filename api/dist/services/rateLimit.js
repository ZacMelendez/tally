"use strict";
"use server";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkRateLimit = void 0;
const ratelimit_1 = require("@upstash/ratelimit");
const redis_1 = require("@upstash/redis");
const redis = new redis_1.Redis({
    url: process.env.KV_REST_API_URL,
    token: process.env.KV_REST_API_TOKEN,
});
const ratelimit = new ratelimit_1.Ratelimit({
    redis,
    limiter: ratelimit_1.Ratelimit.slidingWindow(10, "60 s"),
});
const checkRateLimit = async (identifier) => {
    if (!identifier)
        return { success: false };
    const { success, reason } = await ratelimit.limit(identifier);
    return { success, reason };
};
exports.checkRateLimit = checkRateLimit;
//# sourceMappingURL=rateLimit.js.map