import { db } from "../config/firebase";
import { Debt, CreateDebtRequest, UpdateDebtRequest } from "../types";
import { Timestamp } from "firebase-admin/firestore";

export class DebtService {
    private collection = db.collection("debts");

    async getDebts(userId: string): Promise<Debt[]> {
        const snapshot = await this.collection
            .where("userId", "==", userId)
            .orderBy("createdAt", "desc")
            .get();

        return snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt.toDate(),
            updatedAt: doc.data().updatedAt.toDate(),
        })) as Debt[];
    }

    async getDebt(id: string, userId: string): Promise<Debt | null> {
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
        } as Debt;
    }

    async createDebt(
        userId: string,
        debtData: CreateDebtRequest
    ): Promise<Debt> {
        const now = Timestamp.now();
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
        } as Debt;
    }

    async updateDebt(
        id: string,
        userId: string,
        updates: UpdateDebtRequest
    ): Promise<Debt> {
        const docRef = this.collection.doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            throw new Error("Debt not found");
        }

        const data = doc.data();
        if (data?.userId !== userId) {
            throw new Error("Unauthorized");
        }

        const now = Timestamp.now();
        const updateData = {
            ...updates,
            updatedAt: now,
        };

        await docRef.update(updateData);

        const updatedDoc = await docRef.get();
        const updatedData = updatedDoc.data()!;

        return {
            id: doc.id,
            ...updatedData,
            createdAt: updatedData.createdAt.toDate(),
            updatedAt: updatedData.updatedAt.toDate(),
        } as Debt;
    }

    async deleteDebt(id: string, userId: string): Promise<void> {
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

    async getTotalDebtsValue(userId: string): Promise<number> {
        const snapshot = await this.collection
            .where("userId", "==", userId)
            .get();

        return snapshot.docs.reduce((sum, doc) => {
            return sum + (doc.data().amount || 0);
        }, 0);
    }
}
