import { auth } from "../lib/firebase";
import {
    Asset,
    Debt,
    NetWorthSnapshot,
    AssetValueHistory,
    DebtValueHistory,
    CreateAssetRequest,
    UpdateAssetRequest,
    CreateDebtRequest,
    UpdateDebtRequest,
    AddValueHistoryRequest,
    ApiResponse,
} from "../types";

const API_BASE_URL =
    import.meta.env.VITE_API_URL || "http://localhost:3001/api";

class ApiService {
    private async getAuthToken(): Promise<string> {
        const user = auth.currentUser;
        if (!user) {
            throw new Error("User not authenticated");
        }
        return await user.getIdToken();
    }

    async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<ApiResponse<T>> {
        const token = await this.getAuthToken();

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
                ...options.headers,
            },
        });

        if (!response.ok) {
            const error = await response
                .json()
                .catch(() => ({ message: "Network error" }));
            throw new Error(
                error.error || error.message || "API request failed"
            );
        }

        return await response.json();
    }

    // Asset methods
    async getAssets(): Promise<Asset[]> {
        const response = await this.request<Asset[]>("/assets");
        return response.data || [];
    }

    async getAsset(id: string): Promise<Asset> {
        const response = await this.request<Asset>(`/assets/${id}`);
        if (!response.data) {
            throw new Error("Asset not found");
        }
        return response.data;
    }

    async createAsset(asset: CreateAssetRequest): Promise<Asset> {
        const response = await this.request<Asset>("/assets", {
            method: "POST",
            body: JSON.stringify(asset),
        });
        if (!response.data) {
            throw new Error("Failed to create asset");
        }
        return response.data;
    }

    async updateAsset(id: string, updates: UpdateAssetRequest): Promise<Asset> {
        const response = await this.request<Asset>(`/assets/${id}`, {
            method: "PUT",
            body: JSON.stringify(updates),
        });
        if (!response.data) {
            throw new Error("Failed to update asset");
        }
        return response.data;
    }

    async deleteAsset(id: string): Promise<void> {
        await this.request(`/assets/${id}`, {
            method: "DELETE",
        });
    }

    async getAssetHistory(
        id: string,
        limit?: number
    ): Promise<AssetValueHistory[]> {
        const queryParams = limit ? `?limit=${limit}` : "";
        const response = await this.request<AssetValueHistory[]>(
            `/assets/${id}/history${queryParams}`
        );
        return response.data || [];
    }

    async addAssetHistory(
        id: string,
        data: AddValueHistoryRequest
    ): Promise<AssetValueHistory> {
        const response = await this.request<AssetValueHistory>(
            `/assets/${id}/history`,
            {
                method: "POST",
                body: JSON.stringify(data),
            }
        );
        if (!response.data) {
            throw new Error("Failed to add asset history");
        }
        return response.data;
    }

    // Debt methods
    async getDebts(): Promise<Debt[]> {
        const response = await this.request<Debt[]>("/debts");
        return response.data || [];
    }

    async getDebt(id: string): Promise<Debt> {
        const response = await this.request<Debt>(`/debts/${id}`);
        if (!response.data) {
            throw new Error("Debt not found");
        }
        return response.data;
    }

    async createDebt(debt: CreateDebtRequest): Promise<Debt> {
        const response = await this.request<Debt>("/debts", {
            method: "POST",
            body: JSON.stringify(debt),
        });
        if (!response.data) {
            throw new Error("Failed to create debt");
        }
        return response.data;
    }

    async updateDebt(id: string, updates: UpdateDebtRequest): Promise<Debt> {
        const response = await this.request<Debt>(`/debts/${id}`, {
            method: "PUT",
            body: JSON.stringify(updates),
        });
        if (!response.data) {
            throw new Error("Failed to update debt");
        }
        return response.data;
    }

    async deleteDebt(id: string): Promise<void> {
        await this.request(`/debts/${id}`, {
            method: "DELETE",
        });
    }

    async getDebtHistory(
        id: string,
        limit?: number
    ): Promise<DebtValueHistory[]> {
        const queryParams = limit ? `?limit=${limit}` : "";
        const response = await this.request<DebtValueHistory[]>(
            `/debts/${id}/history${queryParams}`
        );
        return response.data || [];
    }

    async addDebtHistory(
        id: string,
        data: AddValueHistoryRequest
    ): Promise<DebtValueHistory> {
        const response = await this.request<DebtValueHistory>(
            `/debts/${id}/history`,
            {
                method: "POST",
                body: JSON.stringify(data),
            }
        );
        if (!response.data) {
            throw new Error("Failed to add debt history");
        }
        return response.data;
    }

    // Net worth methods
    async getNetWorthHistory(limit?: number): Promise<NetWorthSnapshot[]> {
        const queryParams = limit ? `?limit=${limit}` : "";
        const response = await this.request<NetWorthSnapshot[]>(
            `/networth/history${queryParams}`
        );
        return response.data || [];
    }

    async getCurrentNetWorth(): Promise<{
        totalAssets: number;
        totalDebts: number;
        netWorth: number;
    }> {
        const response = await this.request<{
            totalAssets: number;
            totalDebts: number;
            netWorth: number;
        }>("/networth/current");
        if (!response.data) {
            throw new Error("Failed to get current net worth");
        }
        return response.data;
    }

    async createNetWorthSnapshot(): Promise<NetWorthSnapshot> {
        const response = await this.request<NetWorthSnapshot>(
            "/networth/snapshot",
            {
                method: "POST",
            }
        );
        if (!response.data) {
            throw new Error("Failed to create net worth snapshot");
        }
        return response.data;
    }

    async shouldCreateSnapshot(): Promise<boolean> {
        const response = await this.request<{ shouldCreate: boolean }>(
            "/networth/should-snapshot"
        );
        return response.data?.shouldCreate || false;
    }
}

export const apiService = new ApiService();
