"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildApp = buildApp;
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const auth_1 = require("./middleware/auth");
const rateLimit_1 = require("./middleware/rateLimit");
const assets_1 = require("./routes/assets");
const debts_1 = require("./routes/debts");
const networth_1 = require("./routes/networth");
const fastify = (0, fastify_1.default)({
    logger: {
        level: process.env.LOG_LEVEL || "info",
    },
});
const requiredEnvVars = [
    "FIREBASE_PROJECT_ID",
    "FIREBASE_PRIVATE_KEY_ID",
    "FIREBASE_PRIVATE_KEY",
    "FIREBASE_CLIENT_EMAIL",
    "FIREBASE_CLIENT_ID",
];
for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        console.error(`Missing required environment variable: ${envVar}`);
        process.exit(1);
    }
}
async function buildApp() {
    await fastify.register(cors_1.default, {
        origin: process.env.FRONTEND_URL || true,
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    });
    fastify.get("/health", async () => {
        return {
            status: "ok",
            timestamp: new Date().toISOString(),
            version: process.env.npm_package_version || "1.0.0",
        };
    });
    fastify.register(async function (fastify) {
        fastify.addHook("preHandler", auth_1.authenticateUser);
        fastify.addHook("preHandler", rateLimit_1.globalRateLimit);
        fastify.get("/rate-limit/info", rateLimit_1.getRateLimitInfo);
        fastify.get("/rate-limit/stats", rateLimit_1.getRateLimitStats);
        await fastify.register(assets_1.assetRoutes, { prefix: "/assets" });
        await fastify.register(debts_1.debtRoutes, { prefix: "/debts" });
        await fastify.register(networth_1.networthRoutes, { prefix: "/networth" });
    }, { prefix: "/api" });
    fastify.setErrorHandler((error, request, reply) => {
        console.error("Global error handler:", error);
        if (error.validation) {
            return reply.status(400).send({
                success: false,
                error: "Validation error",
                details: error.validation,
            });
        }
        if (error.statusCode) {
            return reply.status(error.statusCode).send({
                success: false,
                error: error.message,
            });
        }
        return reply.status(500).send({
            success: false,
            error: "Internal server error",
        });
    });
    return fastify;
}
async function start() {
    try {
        const app = await buildApp();
        const port = parseInt(process.env.PORT || "3001");
        const host = process.env.HOST || "0.0.0.0";
        await app.listen({ port, host });
        console.log(`🚀 Server listening on http://${host}:${port}`);
        console.log(`📊 API available at http://${host}:${port}/api`);
        console.log(`❤️  Health check at http://${host}:${port}/health`);
    }
    catch (error) {
        console.error("Error starting server:", error);
        process.exit(1);
    }
}
const gracefulShutdown = async (signal) => {
    console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
    try {
        await fastify.close();
        console.log("✅ Server closed successfully");
        process.exit(0);
    }
    catch (error) {
        console.error("❌ Error during shutdown:", error);
        process.exit(1);
    }
};
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
if (require.main === module) {
    start();
}
//# sourceMappingURL=server.js.map