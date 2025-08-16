"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assetRoutes = assetRoutes;
const assetService_1 = require("../services/assetService");
const valueHistoryService_1 = require("../services/valueHistoryService");
const netWorthService_1 = require("../services/netWorthService");
const rateLimit_1 = require("../middleware/rateLimit");
async function assetRoutes(fastify) {
    const assetService = new assetService_1.AssetService();
    const valueHistoryService = new valueHistoryService_1.ValueHistoryService();
    const netWorthService = new netWorthService_1.NetWorthService();
    fastify.get("/", {
        preHandler: rateLimit_1.globalRateLimit,
    }, async (request, reply) => {
        try {
            const assets = await assetService.getAssets(request.userId);
            const response = {
                success: true,
                data: assets,
            };
            return reply.send(response);
        }
        catch (error) {
            console.error("Error fetching assets:", error);
            return reply.status(500).send({
                success: false,
                error: "Failed to fetch assets",
            });
        }
    });
    fastify.get("/:id", {
        preHandler: rateLimit_1.globalRateLimit,
    }, async (request, reply) => {
        try {
            const asset = await assetService.getAsset(request.params.id, request.userId);
            if (!asset) {
                return reply.status(404).send({
                    success: false,
                    error: "Asset not found",
                });
            }
            const response = {
                success: true,
                data: asset,
            };
            return reply.send(response);
        }
        catch (error) {
            if (error instanceof Error &&
                error.message === "Unauthorized") {
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
    fastify.post("/", { preHandler: rateLimit_1.assetRateLimit }, async (request, reply) => {
        try {
            const asset = await assetService.createAsset(request.userId, request.body);
            try {
                await valueHistoryService.createInitialAssetHistory(asset.id, request.userId, asset.value);
            }
            catch (historyError) {
                console.error("Error creating initial asset history:", historyError);
            }
            try {
                await netWorthService.createSnapshotFromCurrentData(request.userId);
            }
            catch (snapshotError) {
                console.error("Error creating net worth snapshot:", snapshotError);
            }
            const response = {
                success: true,
                data: asset,
                message: "Asset created successfully",
            };
            return reply.status(201).send(response);
        }
        catch (error) {
            console.error("Error creating asset:", error);
            return reply.status(500).send({
                success: false,
                error: "Failed to create asset",
            });
        }
    });
    fastify.put("/:id", { preHandler: rateLimit_1.assetRateLimit }, async (request, reply) => {
        try {
            const asset = await assetService.updateAsset(request.params.id, request.userId, request.body);
            try {
                await netWorthService.createSnapshotFromCurrentData(request.userId);
            }
            catch (snapshotError) {
                console.error("Error creating net worth snapshot:", snapshotError);
            }
            const response = {
                success: true,
                data: asset,
                message: "Asset updated successfully",
            };
            return reply.send(response);
        }
        catch (error) {
            if (error instanceof Error &&
                error.message === "Asset not found") {
                return reply.status(404).send({
                    success: false,
                    error: "Asset not found",
                });
            }
            if (error instanceof Error &&
                error.message === "Unauthorized") {
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
    });
    fastify.delete("/:id", { preHandler: rateLimit_1.deleteRateLimit }, async (request, reply) => {
        try {
            await assetService.deleteAsset(request.params.id, request.userId);
            try {
                await netWorthService.createSnapshotFromCurrentData(request.userId);
            }
            catch (snapshotError) {
                console.error("Error creating net worth snapshot:", snapshotError);
            }
            const response = {
                success: true,
                message: "Asset deleted successfully",
            };
            return reply.send(response);
        }
        catch (error) {
            if (error instanceof Error &&
                error.message === "Asset not found") {
                return reply.status(404).send({
                    success: false,
                    error: "Asset not found",
                });
            }
            if (error instanceof Error &&
                error.message === "Unauthorized") {
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
    });
    fastify.get("/:id/history", {
        preHandler: rateLimit_1.globalRateLimit,
    }, async (request, reply) => {
        try {
            const limit = request.query.limit
                ? parseInt(request.query.limit)
                : undefined;
            const history = await valueHistoryService.getAssetValueHistory(request.params.id, request.userId, limit);
            const response = {
                success: true,
                data: history,
            };
            return reply.send(response);
        }
        catch (error) {
            console.error("Error fetching asset history:", error);
            return reply.status(500).send({
                success: false,
                error: "Failed to fetch asset history",
            });
        }
    });
    fastify.post("/:id/history", {
        preHandler: rateLimit_1.assetRateLimit,
    }, async (request, reply) => {
        try {
            const history = await valueHistoryService.addAssetValueHistory(request.params.id, request.userId, request.body);
            try {
                await netWorthService.createSnapshotFromCurrentData(request.userId);
            }
            catch (snapshotError) {
                console.error("Error creating net worth snapshot:", snapshotError);
            }
            const response = {
                success: true,
                data: history,
                message: "Asset value history added successfully",
            };
            return reply.status(201).send(response);
        }
        catch (error) {
            console.error("Error adding asset value history:", error);
            return reply.status(500).send({
                success: false,
                error: "Failed to add asset value history",
            });
        }
    });
}
//# sourceMappingURL=assets.js.map