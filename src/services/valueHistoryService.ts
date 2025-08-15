import {
    collection,
    addDoc,
    query,
    where,
    orderBy,
    getDocs,
    limit,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { AssetValueHistory, DebtValueHistory } from "../types";

// Asset Value History Functions
export const addAssetValueHistory = async (
    assetId: string,
    userId: string,
    value: number,
    note?: string
): Promise<void> => {
    await addDoc(collection(db, "assetValueHistory"), {
        assetId,
        userId,
        value,
        note: note || "",
        createdAt: new Date(),
    });
};

export const getAssetValueHistory = async (
    assetId: string,
    userId: string,
    limitCount?: number
): Promise<AssetValueHistory[]> => {
    const q = query(
        collection(db, "assetValueHistory"),
        where("assetId", "==", assetId),
        where("userId", "==", userId),
        orderBy("createdAt", "desc"),
        ...(limitCount ? [limit(limitCount)] : [])
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
    })) as AssetValueHistory[];
};

// Note: Real-time updates can be implemented using onSnapshot if needed in the future

// Debt Value History Functions
export const addDebtValueHistory = async (
    debtId: string,
    userId: string,
    amount: number,
    note?: string
): Promise<void> => {
    await addDoc(collection(db, "debtValueHistory"), {
        debtId,
        userId,
        amount,
        note: note || "",
        createdAt: new Date(),
    });
};

export const getDebtValueHistory = async (
    debtId: string,
    userId: string,
    limitCount?: number
): Promise<DebtValueHistory[]> => {
    const q = query(
        collection(db, "debtValueHistory"),
        where("debtId", "==", debtId),
        where("userId", "==", userId),
        orderBy("createdAt", "desc"),
        ...(limitCount ? [limit(limitCount)] : [])
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
    })) as DebtValueHistory[];
};

// Get all asset histories for a user (for analytics)
export const getAllAssetHistoriesForUser = async (
    userId: string,
    limitCount?: number
): Promise<AssetValueHistory[]> => {
    const q = query(
        collection(db, "assetValueHistory"),
        where("userId", "==", userId),
        orderBy("createdAt", "desc"),
        ...(limitCount ? [limit(limitCount)] : [])
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
    })) as AssetValueHistory[];
};

// Get all debt histories for a user (for analytics)
export const getAllDebtHistoriesForUser = async (
    userId: string,
    limitCount?: number
): Promise<DebtValueHistory[]> => {
    const q = query(
        collection(db, "debtValueHistory"),
        where("userId", "==", userId),
        orderBy("createdAt", "desc"),
        ...(limitCount ? [limit(limitCount)] : [])
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
    })) as DebtValueHistory[];
};

// Utility function to create initial history entry when asset/debt is created
export const createInitialAssetHistory = async (
    assetId: string,
    userId: string,
    value: number
): Promise<void> => {
    await addAssetValueHistory(assetId, userId, value, "Initial value");
};

export const createInitialDebtHistory = async (
    debtId: string,
    userId: string,
    amount: number
): Promise<void> => {
    await addDebtValueHistory(debtId, userId, amount, "Initial amount");
};
