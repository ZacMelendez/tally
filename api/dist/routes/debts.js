"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.debtRoutes = debtRoutes;
const debtService_1 = require("../services/debtService");
const valueHistoryService_1 = require("../services/valueHistoryService");
const netWorthService_1 = require("../services/netWorthService");
const rateLimit_1 = require("../middleware/rateLimit");
async function debtRoutes(fastify) {
    const debtService = new debtService_1.DebtService();
    const valueHistoryService = new valueHistoryService_1.ValueHistoryService();
    const netWorthService = new netWorthService_1.NetWorthService();
    fastify.get("/", {
        preHandler: rateLimit_1.globalRateLimit,
    }, async (request, reply) => {
        try {
            const debts = await debtService.getDebts(request.userId);
            const response = {
                success: true,
                data: debts,
            };
            return reply.send(response);
        }
        catch (error) {
            console.error("Error fetching debts:", error);
            return reply.status(500).send({
                success: false,
                error: "Failed to fetch debts",
            });
        }
    });
    fastify.get("/:id", {
        preHandler: rateLimit_1.globalRateLimit,
    }, async (request, reply) => {
        try {
            const debt = await debtService.getDebt(request.params.id, request.userId);
            if (!debt) {
                return reply.status(404).send({
                    success: false,
                    error: "Debt not found",
                });
            }
            const response = {
                success: true,
                data: debt,
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
            console.error("Error fetching debt:", error);
            return reply.status(500).send({
                success: false,
                error: "Failed to fetch debt",
            });
        }
    });
    fastify.post("/", { preHandler: rateLimit_1.debtRateLimit }, async (request, reply) => {
        try {
            const debt = await debtService.createDebt(request.userId, request.body);
            try {
                await valueHistoryService.createInitialDebtHistory(debt.id, request.userId, debt.amount);
            }
            catch (historyError) {
                console.error("Error creating initial debt history:", historyError);
            }
            try {
                await netWorthService.createSnapshotFromCurrentData(request.userId);
            }
            catch (snapshotError) {
                console.error("Error creating net worth snapshot:", snapshotError);
            }
            const response = {
                success: true,
                data: debt,
                message: "Debt created successfully",
            };
            return reply.status(201).send(response);
        }
        catch (error) {
            console.error("Error creating debt:", error);
            return reply.status(500).send({
                success: false,
                error: "Failed to create debt",
            });
        }
    });
    fastify.put("/:id", { preHandler: rateLimit_1.debtRateLimit }, async (request, reply) => {
        try {
            const debt = await debtService.updateDebt(request.params.id, request.userId, request.body);
            try {
                await netWorthService.createSnapshotFromCurrentData(request.userId);
            }
            catch (snapshotError) {
                console.error("Error creating net worth snapshot:", snapshotError);
            }
            const response = {
                success: true,
                data: debt,
                message: "Debt updated successfully",
            };
            return reply.send(response);
        }
        catch (error) {
            if (error instanceof Error &&
                error.message === "Debt not found") {
                return reply.status(404).send({
                    success: false,
                    error: "Debt not found",
                });
            }
            if (error instanceof Error &&
                error.message === "Unauthorized") {
                return reply.status(403).send({
                    success: false,
                    error: "Unauthorized",
                });
            }
            console.error("Error updating debt:", error);
            return reply.status(500).send({
                success: false,
                error: "Failed to update debt",
            });
        }
    });
    fastify.delete("/:id", { preHandler: rateLimit_1.deleteRateLimit }, async (request, reply) => {
        try {
            await debtService.deleteDebt(request.params.id, request.userId);
            try {
                await netWorthService.createSnapshotFromCurrentData(request.userId);
            }
            catch (snapshotError) {
                console.error("Error creating net worth snapshot:", snapshotError);
            }
            const response = {
                success: true,
                message: "Debt deleted successfully",
            };
            return reply.send(response);
        }
        catch (error) {
            if (error instanceof Error &&
                error.message === "Debt not found") {
                return reply.status(404).send({
                    success: false,
                    error: "Debt not found",
                });
            }
            if (error instanceof Error &&
                error.message === "Unauthorized") {
                return reply.status(403).send({
                    success: false,
                    error: "Unauthorized",
                });
            }
            console.error("Error deleting debt:", error);
            return reply.status(500).send({
                success: false,
                error: "Failed to delete debt",
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
            const history = await valueHistoryService.getDebtValueHistory(request.params.id, request.userId, limit);
            const response = {
                success: true,
                data: history,
            };
            return reply.send(response);
        }
        catch (error) {
            console.error("Error fetching debt history:", error);
            return reply.status(500).send({
                success: false,
                error: "Failed to fetch debt history",
            });
        }
    });
    fastify.post("/:id/history", {
        preHandler: rateLimit_1.debtRateLimit,
    }, async (request, reply) => {
        try {
            const history = await valueHistoryService.addDebtValueHistory(request.params.id, request.userId, request.body);
            try {
                await netWorthService.createSnapshotFromCurrentData(request.userId);
            }
            catch (snapshotError) {
                console.error("Error creating net worth snapshot:", snapshotError);
            }
            const response = {
                success: true,
                data: history,
                message: "Debt value history added successfully",
            };
            return reply.status(201).send(response);
        }
        catch (error) {
            console.error("Error adding debt value history:", error);
            return reply.status(500).send({
                success: false,
                error: "Failed to add debt value history",
            });
        }
    });
}
//# sourceMappingURL=debts.js.map