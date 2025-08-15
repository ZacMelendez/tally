import React, { useEffect } from "react";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import {
    createNetWorthSnapshot,
    shouldCreateSnapshot,
} from "./services/netWorthService";
import Header from "./components/Header";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import {
    collection,
    query,
    where,
    onSnapshot,
    getDocs,
} from "firebase/firestore";
import { db } from "./lib/firebase";

const AppContent: React.FC = () => {
    const { currentUser, loading } = useAuth();

    // Auto-create net worth snapshots when data changes
    useEffect(() => {
        if (!currentUser) return;

        const unsubscribeAssets = onSnapshot(
            query(
                collection(db, "assets"),
                where("userId", "==", currentUser.id)
            ),
            () => {
                checkAndCreateSnapshot();
            }
        );

        const unsubscribeDebts = onSnapshot(
            query(
                collection(db, "debts"),
                where("userId", "==", currentUser.id)
            ),
            () => {
                checkAndCreateSnapshot();
            }
        );

        const checkAndCreateSnapshot = async () => {
            try {
                if (await shouldCreateSnapshot(currentUser.id)) {
                    // Calculate totals from current data
                    // This is a simplified version - in a real app you'd want to batch these reads
                    const assetsSnapshot = await getDocs(
                        query(
                            collection(db, "assets"),
                            where("userId", "==", currentUser.id)
                        )
                    );
                    const debtsSnapshot = await getDocs(
                        query(
                            collection(db, "debts"),
                            where("userId", "==", currentUser.id)
                        )
                    );

                    const totalAssets = assetsSnapshot.docs.reduce(
                        (sum, doc) => sum + doc.data().value,
                        0
                    );
                    const totalDebts = debtsSnapshot.docs.reduce(
                        (sum, doc) => sum + doc.data().amount,
                        0
                    );

                    await createNetWorthSnapshot(
                        currentUser.id,
                        totalAssets,
                        totalDebts
                    );
                }
            } catch (error) {
                console.error("Error creating net worth snapshot:", error);
            }
        };

        return () => {
            unsubscribeAssets();
            unsubscribeDebts();
        };
    }, [currentUser]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="loading-spinner" />
            </div>
        );
    }

    if (!currentUser) {
        return <Login />;
    }

    return (
        <>
            <Header />
            <Dashboard />
        </>
    );
};

function App() {
    return (
        <AuthProvider>
            <AppContent />
            <Toaster
                position="top-right"
                toastOptions={{
                    duration: 4000,
                    style: {
                        background: "#0a0a0a",
                        color: "#fafafa",
                        border: "none",
                        boxShadow:
                            "0 0 0 1px rgba(255, 255, 255, 0.1), 0 8px 32px rgba(0, 0, 0, 0.4)",
                        borderRadius: "12px",
                        backdropFilter: "blur(16px)",
                    },
                    success: {
                        iconTheme: {
                            primary: "#10b981",
                            secondary: "#ffffff",
                        },
                    },
                    error: {
                        iconTheme: {
                            primary: "#e11d48",
                            secondary: "#ffffff",
                        },
                    },
                }}
            />
        </AuthProvider>
    );
}

export default App;
