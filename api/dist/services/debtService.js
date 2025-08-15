"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DebtService = void 0;
const firebase_1 = require("../config/firebase");
const firestore_1 = require("firebase-admin/firestore");
class DebtService {
    collection = firebase_1.db.collection("debts");
    async getDebts(userId) {
        const snapshot = await this.collection
            .where("userId", "==", userId)
            .orderBy("createdAt", "desc")
            .get();
        return snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt.toDate(),
            updatedAt: doc.data().updatedAt.toDate(),
        }));
    }
    async getDebt(id, userId) {
        const doc = await this.collection.doc(id).get();
        if (!doc.exists) {
            return null;
        }
        const data = doc.data();
        if (data?.userId !== userId) {
            throw new Error("Unauthorized");
        }
        return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt.toDate(),
            updatedAt: data.updatedAt.toDate(),
        };
    }
    async createDebt(userId, debtData) {
        const now = firestore_1.Timestamp.now();
        const docData = {
            ...debtData,
            userId,
            createdAt: now,
            updatedAt: now,
        };
        const docRef = await this.collection.add(docData);
        return {
            id: docRef.id,
            ...docData,
            createdAt: now.toDate(),
            updatedAt: now.toDate(),
        };
    }
    async updateDebt(id, userId, updates) {
        const docRef = this.collection.doc(id);
        const doc = await docRef.get();
        if (!doc.exists) {
            throw new Error("Debt not found");
        }
        const data = doc.data();
        if (data?.userId !== userId) {
            throw new Error("Unauthorized");
        }
        const now = firestore_1.Timestamp.now();
        const updateData = {
            ...updates,
            updatedAt: now,
        };
        await docRef.update(updateData);
        const updatedDoc = await docRef.get();
        const updatedData = updatedDoc.data();
        return {
            id: doc.id,
            ...updatedData,
            createdAt: updatedData.createdAt.toDate(),
            updatedAt: updatedData.updatedAt.toDate(),
        };
    }
    async deleteDebt(id, userId) {
        const docRef = this.collection.doc(id);
        const doc = await docRef.get();
        if (!doc.exists) {
            throw new Error("Debt not found");
        }
        const data = doc.data();
        if (data?.userId !== userId) {
            throw new Error("Unauthorized");
        }
        await docRef.delete();
    }
    async getTotalDebtsValue(userId) {
        const snapshot = await this.collection
            .where("userId", "==", userId)
            .get();
        return snapshot.docs.reduce((sum, doc) => {
            return sum + (doc.data().amount || 0);
        }, 0);
    }
}
exports.DebtService = DebtService;
//# sourceMappingURL=debtService.js.map