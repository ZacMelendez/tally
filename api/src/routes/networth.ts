import { FastifyInstance } from "fastify";
import { NetWorthService } from "../services/netWorthService";
import { ApiResponse } from "../types";

export async function networthRoutes(fastify: FastifyInstance) {
    const netWorthService = new NetWorthService();

    // Get net worth history
    fastify.get<{
        Querystring: { limit?: string };
    }>("/history", async (request, reply) => {
        try {
            const limit = request.query.limit
                ? parseInt(request.query.limit)
                : undefined;
            const history = await netWorthService.getNetWorthHistory(
                request.userId!,
                limit
            );

            const response: ApiResponse = {
                success: true,
                data: history,
            };

            return reply.send(response);
        } catch (error) {
            console.error("Error fetching net worth history:", error);
            return reply.status(500).send({
                success: false,
                error: "Failed to fetch net worth history",
            });
        }
    });

    // Get current net worth
    fastify.get("/current", async (request, reply) => {
        try {
            const currentNetWorth = await netWorthService.getCurrentNetWorth(
                request.userId!
            );

            const response: ApiResponse = {
                success: true,
                data: currentNetWorth,
            };

            return reply.send(response);
        } catch (error) {
            console.error("Error fetching current net worth:", error);
            return reply.status(500).send({
                success: false,
                error: "Failed to fetch current net worth",
            });
        }
    });

    // Create snapshot manually
    fastify.post("/snapshot", async (request, reply) => {
        try {
            const snapshot =
                await netWorthService.createSnapshotFromCurrentData(
                    request.userId!
                );

            if (!snapshot) {
                return reply.status(500).send({
                    success: false,
                    error: "Failed to create net worth snapshot",
                });
            }

            const response: ApiResponse = {
                success: true,
                data: snapshot,
                message: "Net worth snapshot created successfully",
            };

            return reply.status(201).send(response);
        } catch (error) {
            console.error("Error creating net worth snapshot:", error);
            return reply.status(500).send({
                success: false,
                error: "Failed to create net worth snapshot",
            });
        }
    });

    // Check if should create snapshot (for daily snapshots)
    fastify.get("/should-snapshot", async (request, reply) => {
        try {
            const shouldCreate = await netWorthService.shouldCreateSnapshot(
                request.userId!
            );

            const response: ApiResponse = {
                success: true,
                data: { shouldCreate },
            };

            return reply.send(response);
        } catch (error) {
            console.error("Error checking snapshot status:", error);
            return reply.status(500).send({
                success: false,
                error: "Failed to check snapshot status",
            });
        }
    });
}
