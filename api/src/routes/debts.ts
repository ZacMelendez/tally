import { FastifyInstance } from "fastify";
import { DebtService } from "../services/debtService";
import { ValueHistoryService } from "../services/valueHistoryService";
import { NetWorthService } from "../services/netWorthService";
import { ApiResponse } from "../types";
import {
    debtAddRateLimit,
    debtUpdateRateLimit,
    deleteRateLimit,
} from "../middleware/rateLimit";

export async function debtRoutes(fastify: FastifyInstance) {
    const debtService = new DebtService();
    const valueHistoryService = new ValueHistoryService();
    const netWorthService = new NetWorthService();

    // Get all debts for user
    fastify.get("/", async (request, reply) => {
        try {
            const debts = await debtService.getDebts(request.userId!);

            const response: ApiResponse = {
                success: true,
                data: debts,
            };

            return reply.send(response);
        } catch (error) {
            console.error("Error fetching debts:", error);
            return reply.status(500).send({
                success: false,
                error: "Failed to fetch debts",
            });
        }
    });

    // Get specific debt
    fastify.get<{ Params: { id: string } }>("/:id", async (request, reply) => {
        try {
            const debt = await debtService.getDebt(
                request.params.id,
                request.userId!
            );

            if (!debt) {
                return reply.status(404).send({
                    success: false,
                    error: "Debt not found",
                });
            }

            const response: ApiResponse = {
                success: true,
                data: debt,
            };

            return reply.send(response);
        } catch (error) {
            if (error instanceof Error && error.message === "Unauthorized") {
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

    // Create new debt
    fastify.post(
        "/",
        { preHandler: debtAddRateLimit },
        async (request, reply) => {
            try {
                const debt = await debtService.createDebt(
                    request.userId!,
                    request.body as any
                );

                // Create initial history entry
                try {
                    await valueHistoryService.createInitialDebtHistory(
                        debt.id,
                        request.userId!,
                        debt.amount
                    );
                } catch (historyError) {
                    console.error(
                        "Error creating initial debt history:",
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
                    data: debt,
                    message: "Debt created successfully",
                };

                return reply.status(201).send(response);
            } catch (error) {
                console.error("Error creating debt:", error);
                return reply.status(500).send({
                    success: false,
                    error: "Failed to create debt",
                });
            }
        }
    );

    // Update debt
    fastify.put<{ Params: { id: string } }>(
        "/:id",
        { preHandler: debtUpdateRateLimit },
        async (request, reply) => {
            try {
                const debt = await debtService.updateDebt(
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
                    data: debt,
                    message: "Debt updated successfully",
                };

                return reply.send(response);
            } catch (error) {
                if (
                    error instanceof Error &&
                    error.message === "Debt not found"
                ) {
                    return reply.status(404).send({
                        success: false,
                        error: "Debt not found",
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

                console.error("Error updating debt:", error);
                return reply.status(500).send({
                    success: false,
                    error: "Failed to update debt",
                });
            }
        }
    );

    // Delete debt
    fastify.delete<{ Params: { id: string } }>(
        "/:id",
        { preHandler: deleteRateLimit },
        async (request, reply) => {
            try {
                await debtService.deleteDebt(
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
                    message: "Debt deleted successfully",
                };

                return reply.send(response);
            } catch (error) {
                if (
                    error instanceof Error &&
                    error.message === "Debt not found"
                ) {
                    return reply.status(404).send({
                        success: false,
                        error: "Debt not found",
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

                console.error("Error deleting debt:", error);
                return reply.status(500).send({
                    success: false,
                    error: "Failed to delete debt",
                });
            }
        }
    );

    // Get debt value history
    fastify.get<{
        Params: { id: string };
        Querystring: { limit?: string };
    }>("/:id/history", async (request, reply) => {
        try {
            const limit = request.query.limit
                ? parseInt(request.query.limit)
                : undefined;
            const history = await valueHistoryService.getDebtValueHistory(
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
            console.error("Error fetching debt history:", error);
            return reply.status(500).send({
                success: false,
                error: "Failed to fetch debt history",
            });
        }
    });

    // Add value history entry
    fastify.post<{ Params: { id: string } }>(
        "/:id/history",
        async (request, reply) => {
            try {
                const history = await valueHistoryService.addDebtValueHistory(
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
                    message: "Debt value history added successfully",
                };

                return reply.status(201).send(response);
            } catch (error) {
                console.error("Error adding debt value history:", error);
                return reply.status(500).send({
                    success: false,
                    error: "Failed to add debt value history",
                });
            }
        }
    );
}
