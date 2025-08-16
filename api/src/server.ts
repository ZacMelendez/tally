import Fastify from "fastify";
import cors from "@fastify/cors";
import { authenticateUser } from "./middleware/auth";
import { globalRateLimit, getRateLimitInfo } from "./middleware/rateLimit";
import { assetRoutes } from "./routes/assets";
import { debtRoutes } from "./routes/debts";
import { networthRoutes } from "./routes/networth";
import dotenv from "dotenv";
dotenv.config();

const fastify = Fastify({
    logger: {
        level: process.env.LOG_LEVEL || "info",
    },
});

// Environment validation
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
    // Register CORS
    await fastify.register(cors, {
        origin: process.env.FRONTEND_URL || true,
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    });

    // Health check endpoint
    fastify.get("/health", async () => {
        return {
            status: "ok",
            timestamp: new Date().toISOString(),
            version: process.env.npm_package_version || "1.0.0",
        };
    });

    // Protected routes
    fastify.register(
        async function (fastify) {
            // Add authentication middleware
            fastify.addHook("preHandler", authenticateUser);

            // Add global rate limiting middleware
            fastify.addHook("preHandler", globalRateLimit);

            // Rate limit info endpoints
            fastify.get("/rate-limit/info", getRateLimitInfo);

            // Register protected routes
            await fastify.register(assetRoutes, { prefix: "/assets" });
            await fastify.register(debtRoutes, { prefix: "/debts" });
            await fastify.register(networthRoutes, { prefix: "/networth" });
        },
        { prefix: "/api" }
    );

    // Global error handler
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
    } catch (error) {
        console.error("Error starting server:", error);
        process.exit(1);
    }
}

// Handle graceful shutdown
const gracefulShutdown = async (signal: string) => {
    console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
    try {
        await fastify.close();
        console.log("✅ Server closed successfully");
        process.exit(0);
    } catch (error) {
        console.error("❌ Error during shutdown:", error);
        process.exit(1);
    }
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Start the server
if (require.main === module) {
    start();
}

export { buildApp };
