"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NetWorthService = void 0;
const firebase_1 = require("../config/firebase");
const firestore_1 = require("firebase-admin/firestore");
const assetService_1 = require("./assetService");
const debtService_1 = require("./debtService");
class NetWorthService {
    collection = firebase_1.db.collection('netWorthSnapshots');
    assetService = new assetService_1.AssetService();
    debtService = new debtService_1.DebtService();
    async getNetWorthHistory(userId, limit) {
        let query = this.collection
            .where('userId', '==', userId)
            .orderBy('createdAt', 'desc');
        if (limit) {
            query = query.limit(limit);
        }
        const snapshot = await query.get();
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt.toDate()
        }));
    }
    async createNetWorthSnapshot(userId, totalAssets, totalDebts) {
        const now = firestore_1.Timestamp.now();
        const netWorth = totalAssets - totalDebts;
        const docData = {
            userId,
            totalAssets,
            totalDebts,
            netWorth,
            createdAt: now
        };
        const docRef = await this.collection.add(docData);
        return {
            id: docRef.id,
            ...docData,
            createdAt: now.toDate()
        };
    }
    async shouldCreateSnapshot(userId) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayTimestamp = firestore_1.Timestamp.fromDate(today);
        const snapshot = await this.collection
            .where('userId', '==', userId)
            .where('createdAt', '>=', todayTimestamp)
            .limit(1)
            .get();
        return snapshot.empty;
    }
    async createSnapshotFromCurrentData(userId) {
        try {
            const totalAssets = await this.assetService.getTotalAssetsValue(userId);
            const totalDebts = await this.debtService.getTotalDebtsValue(userId);
            return await this.createNetWorthSnapshot(userId, totalAssets, totalDebts);
        }
        catch (error) {
            console.error('Error creating net worth snapshot:', error);
            return null;
        }
    }
    async getCurrentNetWorth(userId) {
        const totalAssets = await this.assetService.getTotalAssetsValue(userId);
        const totalDebts = await this.debtService.getTotalDebtsValue(userId);
        const netWorth = totalAssets - totalDebts;
        return {
            totalAssets,
            totalDebts,
            netWorth
        };
    }
}
exports.NetWorthService = NetWorthService;
//# sourceMappingURL=netWorthService.js.map