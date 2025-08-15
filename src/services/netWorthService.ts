import {
    collection,
    addDoc,
    query,
    where,
    limit,
    getDocs,
} from "firebase/firestore";
import { db } from "../lib/firebase";

export const createNetWorthSnapshot = async (
    userId: string,
    totalAssets: number,
    totalDebts: number
): Promise<void> => {
    const netWorth = totalAssets - totalDebts;

    // Always create a new snapshot when called (on asset/debt updates)
    await addDoc(collection(db, "netWorthSnapshots"), {
        userId,
        totalAssets,
        totalDebts,
        netWorth,
        createdAt: new Date(),
    });
};

export const shouldCreateSnapshot = async (
    userId: string
): Promise<boolean> => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaySnapshots = await getDocs(
        query(
            collection(db, "netWorthSnapshots"),
            where("userId", "==", userId),
            where("createdAt", ">=", today),
            limit(1)
        )
    );

    return todaySnapshots.empty;
};

// Helper function to get current asset and debt totals and create snapshot
export const createSnapshotFromCurrentData = async (
    userId: string
): Promise<void> => {
    try {
        // Get current assets
        const assetsQuery = query(
            collection(db, "assets"),
            where("userId", "==", userId)
        );
        const assetsSnapshot = await getDocs(assetsQuery);
        const totalAssets = assetsSnapshot.docs.reduce((sum, doc) => {
            return sum + (doc.data().value || 0);
        }, 0);

        // Get current debts
        const debtsQuery = query(
            collection(db, "debts"),
            where("userId", "==", userId)
        );
        const debtsSnapshot = await getDocs(debtsQuery);
        const totalDebts = debtsSnapshot.docs.reduce((sum, doc) => {
            return sum + (doc.data().amount || 0);
        }, 0);

        // Create snapshot with current totals
        await createNetWorthSnapshot(userId, totalAssets, totalDebts);
    } catch (error) {
        console.error("Error creating net worth snapshot:", error);
        // Don't throw error to avoid breaking the main operation
    }
};
