"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValueHistoryService = void 0;
const firebase_1 = require("../config/firebase");
const firestore_1 = require("firebase-admin/firestore");
class ValueHistoryService {
    assetHistoryCollection = firebase_1.db.collection("assetValueHistory");
    debtHistoryCollection = firebase_1.db.collection("debtValueHistory");
    async addAssetValueHistory(assetId, userId, data) {
        const now = firestore_1.Timestamp.now();
        const docData = {
            assetId,
            userId,
            value: data.value,
            note: data.note || "",
            createdAt: now,
        };
        const docRef = await this.assetHistoryCollection.add(docData);
        return {
            id: docRef.id,
            ...docData,
            createdAt: now.toDate(),
        };
    }
    async getAssetValueHistory(assetId, userId, limit) {
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
        }));
    }
    async getAllAssetHistoriesForUser(userId, limit) {
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
        }));
    }
    async addDebtValueHistory(debtId, userId, data) {
        const now = firestore_1.Timestamp.now();
        const docData = {
            debtId,
            userId,
            amount: data.value,
            note: data.note || "",
            createdAt: now,
        };
        const docRef = await this.debtHistoryCollection.add(docData);
        return {
            id: docRef.id,
            ...docData,
            createdAt: now.toDate(),
        };
    }
    async getDebtValueHistory(debtId, userId, limit) {
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
        }));
    }
    async getAllDebtHistoriesForUser(userId, limit) {
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
        }));
    }
    async createInitialAssetHistory(assetId, userId, value) {
        return this.addAssetValueHistory(assetId, userId, {
            value,
            note: "Initial value",
        });
    }
    async createInitialDebtHistory(debtId, userId, amount) {
        return this.addDebtValueHistory(debtId, userId, {
            value: amount,
            note: "Initial amount",
        });
    }
}
exports.ValueHistoryService = ValueHistoryService;
//# sourceMappingURL=valueHistoryService.js.map