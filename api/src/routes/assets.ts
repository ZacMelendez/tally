import { FastifyInstance } from "fastify";
import { AssetService } from "../services/assetService";
import { ValueHistoryService } from "../services/valueHistoryService";
import { NetWorthService } from "../services/netWorthService";
import { ApiResponse } from "../types";
import {
    assetAddRateLimit,
    assetUpdateRateLimit,
    deleteRateLimit,
} from "../middleware/rateLimit";

export async function assetRoutes(fastify: FastifyInstance) {
    const assetService = new AssetService();
    const valueHistoryService = new ValueHistoryService();
    const netWorthService = new NetWorthService();

    // Get all assets for user
    fastify.get("/", async (request, reply) => {
        try {
            const assets = await assetService.getAssets(request.userId!);

            const response: ApiResponse = {
                success: true,
                data: assets,
            };

            return reply.send(response);
        } catch (error) {
            console.error("Error fetching assets:", error);
            return reply.status(500).send({
                success: false,
                error: "Failed to fetch assets",
            });
        }
    });

    // Get specific asset
    fastify.get<{ Params: { id: string } }>("/:id", async (request, reply) => {
        try {
            const asset = await assetService.getAsset(
                request.params.id,
                request.userId!
            );

            if (!asset) {
                return reply.status(404).send({
                    success: false,
                    error: "Asset not found",
                });
            }

            const response: ApiResponse = {
                success: true,
                data: asset,
            };

            return reply.send(response);
        } catch (error) {
            if (error instanceof Error && error.message === "Unauthorized") {
                return reply.status(403).send({
                    success: false,
                    error: "Unauthorized",
                });
            }

            console.error("Error fetching asset:", error);
            return reply.status(500).send({
                success: false,
                error: "Failed to fetch asset",
            });
        }
    });

    // Create new asset
    fastify.post(
        "/",
        { preHandler: assetAddRateLimit },
        async (request, reply) => {
            try {
                const asset = await assetService.createAsset(
                    request.userId!,
                    request.body as any
                );

                // Create initial history entry
                try {
                    await valueHistoryService.createInitialAssetHistory(
                        asset.id,
                        request.userId!,
                        asset.value
                    );
                } catch (historyError) {
                    console.error(
                        "Error creating initial asset history:",
                        historyError
                    );
                }

                // Create net worth snapshot
                try {
                    await netWorthService.createSnapshotFromCurrentData(
                        request.userId!
                    );
                } catch (snapshotError) {
                    console.error(
                        "Error creating net worth snapshot:",
                        snapshotError
                    );
                }

                const response: ApiResponse = {
                    success: true,
                    data: asset,
                    message: "Asset created successfully",
                };

                return reply.status(201).send(response);
            } catch (error) {
                console.error("Error creating asset:", error);
                return reply.status(500).send({
                    success: false,
                    error: "Failed to create asset",
                });
            }
        }
    );

    // Update asset
    fastify.put<{ Params: { id: string } }>(
        "/:id",
        { preHandler: assetUpdateRateLimit },
        async (request, reply) => {
            try {
                const asset = await assetService.updateAsset(
                    request.params.id,
                    request.userId!,
                    request.body as any
                );

                // Create net worth snapshot
                try {
                    await netWorthService.createSnapshotFromCurrentData(
                        request.userId!
                    );
                } catch (snapshotError) {
                    console.error(
                        "Error creating net worth snapshot:",
                        snapshotError
                    );
                }

                const response: ApiResponse = {
                    success: true,
                    data: asset,
                    message: "Asset updated successfully",
                };

                return reply.send(response);
            } catch (error) {
                if (
                    error instanceof Error &&
                    error.message === "Asset not found"
                ) {
                    return reply.status(404).send({
                        success: false,
                        error: "Asset not found",
                    });
                }

                if (
                    error instanceof Error &&
                    error.message === "Unauthorized"
                ) {
                    return reply.status(403).send({
                        success: false,
                        error: "Unauthorized",
                    });
                }

                console.error("Error updating asset:", error);
                return reply.status(500).send({
                    success: false,
                    error: "Failed to update asset",
                });
            }
        }
    );

    // Delete asset
    fastify.delete<{ Params: { id: string } }>(
        "/:id",
        { preHandler: deleteRateLimit },
        async (request, reply) => {
            try {
                await assetService.deleteAsset(
                    request.params.id,
                    request.userId!
                );

                // Create net worth snapshot
                try {
                    await netWorthService.createSnapshotFromCurrentData(
                        request.userId!
                    );
                } catch (snapshotError) {
                    console.error(
                        "Error creating net worth snapshot:",
                        snapshotError
                    );
                }

                const response: ApiResponse = {
                    success: true,
                    message: "Asset deleted successfully",
                };

                return reply.send(response);
            } catch (error) {
                if (
                    error instanceof Error &&
                    error.message === "Asset not found"
                ) {
                    return reply.status(404).send({
                        success: false,
                        error: "Asset not found",
                    });
                }

                if (
                    error instanceof Error &&
                    error.message === "Unauthorized"
                ) {
                    return reply.status(403).send({
                        success: false,
                        error: "Unauthorized",
                    });
                }

                console.error("Error deleting asset:", error);
                return reply.status(500).send({
                    success: false,
                    error: "Failed to delete asset",
                });
            }
        }
    );

    // Get asset value history
    fastify.get<{
        Params: { id: string };
        Querystring: { limit?: string };
    }>("/:id/history", async (request, reply) => {
        try {
            const limit = request.query.limit
                ? parseInt(request.query.limit)
                : undefined;
            const history = await valueHistoryService.getAssetValueHistory(
                request.params.id,
                request.userId!,
                limit
            );

            const response: ApiResponse = {
                success: true,
                data: history,
            };

            return reply.send(response);
        } catch (error) {
            console.error("Error fetching asset history:", error);
            return reply.status(500).send({
                success: false,
                error: "Failed to fetch asset history",
            });
        }
    });

    // Add value history entry
    fastify.post<{ Params: { id: string } }>(
        "/:id/history",
        async (request, reply) => {
            try {
                const history = await valueHistoryService.addAssetValueHistory(
                    request.params.id,
                    request.userId!,
                    request.body as any
                );

                // Create net worth snapshot
                try {
                    await netWorthService.createSnapshotFromCurrentData(
                        request.userId!
                    );
                } catch (snapshotError) {
                    console.error(
                        "Error creating net worth snapshot:",
                        snapshotError
                    );
                }

                const response: ApiResponse = {
                    success: true,
                    data: history,
                    message: "Asset value history added successfully",
                };

                return reply.status(201).send(response);
            } catch (error) {
                console.error("Error adding asset value history:", error);
                return reply.status(500).send({
                    success: false,
                    error: "Failed to add asset value history",
                });
            }
        }
    );
}
