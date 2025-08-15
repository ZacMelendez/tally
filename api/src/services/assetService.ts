import { db } from "../config/firebase";
import { Asset, CreateAssetRequest, UpdateAssetRequest } from "../types";
import { Timestamp } from "firebase-admin/firestore";

export class AssetService {
    private collection = db.collection("assets");

    async getAssets(userId: string): Promise<Asset[]> {
        const snapshot = await this.collection
            .where("userId", "==", userId)
            .orderBy("createdAt", "desc")
            .get();

        return snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt.toDate(),
            updatedAt: doc.data().updatedAt.toDate(),
        })) as Asset[];
    }

    async getAsset(id: string, userId: string): Promise<Asset | null> {
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
        } as Asset;
    }

    async createAsset(
        userId: string,
        assetData: CreateAssetRequest
    ): Promise<Asset> {
        const now = Timestamp.now();
        const docData = {
            ...assetData,
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
        } as Asset;
    }

    async updateAsset(
        id: string,
        userId: string,
        updates: UpdateAssetRequest
    ): Promise<Asset> {
        const docRef = this.collection.doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            throw new Error("Asset not found");
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
        } as Asset;
    }

    async deleteAsset(id: string, userId: string): Promise<void> {
        const docRef = this.collection.doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            throw new Error("Asset not found");
        }

        const data = doc.data();
        if (data?.userId !== userId) {
            throw new Error("Unauthorized");
        }

        await docRef.delete();
    }

    async getTotalAssetsValue(userId: string): Promise<number> {
        const snapshot = await this.collection
            .where("userId", "==", userId)
            .get();

        return snapshot.docs.reduce((sum, doc) => {
            return sum + (doc.data().value || 0);
        }, 0);
    }
}
