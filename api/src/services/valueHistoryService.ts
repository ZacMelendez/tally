import { db } from "../config/firebase";
import {
    AssetValueHistory,
    DebtValueHistory,
    AddValueHistoryRequest,
} from "../types";
import { Timestamp } from "firebase-admin/firestore";

export class ValueHistoryService {
    private assetHistoryCollection = db.collection("assetValueHistory");
    private assetCollection = db.collection("assets");
    private debtCollection = db.collection("debts");
    private debtHistoryCollection = db.collection("debtValueHistory");

    // Asset Value History
    async addAssetValueHistory(
        assetId: string,
        userId: string,
        data: AddValueHistoryRequest
    ): Promise<AssetValueHistory> {
        const now = Timestamp.now();
        const docData = {
            assetId,
            userId,
            value: data.value,
            note: data.note || "",
            createdAt: now,
        };

        const docRef = await this.assetHistoryCollection.add(docData);

        const assetDoc = await this.assetCollection.doc(assetId).get();

        if (assetDoc.exists) {
            const now = Timestamp.now();
            const updateData = {
                value: data.value,
                updatedAt: now,
            };
            await assetDoc.ref.update(updateData);
        }

        return {
            id: docRef.id,
            ...docData,
            createdAt: now.toDate(),
        } as AssetValueHistory;
    }

    async getAssetValueHistory(
        assetId: string,
        userId: string,
        limit?: number
    ): Promise<AssetValueHistory[]> {
        let query = this.assetHistoryCollection
            .where("assetId", "==", assetId)
            .where("userId", "==", userId)
            .orderBy("createdAt", "desc");

        if (limit) {
            query = query.limit(limit);
        }

        const snapshot = await query.get();

        return snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt.toDate(),
        })) as AssetValueHistory[];
    }

    async getAllAssetHistoriesForUser(
        userId: string,
        limit?: number
    ): Promise<AssetValueHistory[]> {
        let query = this.assetHistoryCollection
            .where("userId", "==", userId)
            .orderBy("createdAt", "desc");

        if (limit) {
            query = query.limit(limit);
        }

        const snapshot = await query.get();

        return snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt.toDate(),
        })) as AssetValueHistory[];
    }

    // Debt Value History
    async addDebtValueHistory(
        debtId: string,
        userId: string,
        data: AddValueHistoryRequest
    ): Promise<DebtValueHistory> {
        const now = Timestamp.now();
        const docData = {
            debtId,
            userId,
            amount: data.value,
            note: data.note || "",
            createdAt: now,
        };

        const docRef = await this.debtHistoryCollection.add(docData);

        const debtDoc = await this.debtCollection.doc(debtId).get();

        if (debtDoc.exists) {
            const now = Timestamp.now();
            const updateData = {
                amount: data.value,
                updatedAt: now,
            };
            await debtDoc.ref.update(updateData);
        }

        return {
            id: docRef.id,
            ...docData,
            createdAt: now.toDate(),
        } as DebtValueHistory;
    }

    async getDebtValueHistory(
        debtId: string,
        userId: string,
        limit?: number
    ): Promise<DebtValueHistory[]> {
        let query = this.debtHistoryCollection
            .where("debtId", "==", debtId)
            .where("userId", "==", userId)
            .orderBy("createdAt", "desc");

        if (limit) {
            query = query.limit(limit);
        }

        const snapshot = await query.get();

        return snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt.toDate(),
        })) as DebtValueHistory[];
    }

    async getAllDebtHistoriesForUser(
        userId: string,
        limit?: number
    ): Promise<DebtValueHistory[]> {
        let query = this.debtHistoryCollection
            .where("userId", "==", userId)
            .orderBy("createdAt", "desc");

        if (limit) {
            query = query.limit(limit);
        }

        const snapshot = await query.get();

        return snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt.toDate(),
        })) as DebtValueHistory[];
    }

    // Utility methods for creating initial history entries
    async createInitialAssetHistory(
        assetId: string,
        userId: string,
        value: number
    ): Promise<AssetValueHistory> {
        return this.addAssetValueHistory(assetId, userId, {
            value,
            note: "Initial value",
        });
    }

    async createInitialDebtHistory(
        debtId: string,
        userId: string,
        amount: number
    ): Promise<DebtValueHistory> {
        return this.addDebtValueHistory(debtId, userId, {
            value: amount,
            note: "Initial amount",
        });
    }
}
