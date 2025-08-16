"use server";

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import dotenv from "dotenv";
dotenv.config();

type RateLimitResponse = Awaited<ReturnType<typeof Ratelimit.prototype.limit>>;

const redis = new Redis({
    url: process.env.KV_REST_API_URL,
    token: process.env.KV_REST_API_TOKEN,
});

const ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(150, "60 s"),
});

export const checkRateLimit = async (
    identifier: string
): Promise<{
    success: boolean;
    reason?: RateLimitResponse["reason"];
}> => {
    if (!identifier) return { success: false };
    const { success, reason } = await ratelimit.limit(identifier);
    return { success, reason };
};
