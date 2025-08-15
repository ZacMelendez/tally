import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    Plus,
    TrendingUp,
    TrendingDown,
    CreditCard,
    Target,
    Activity,
} from "lucide-react";
import {
    collection,
    query,
    where,
    onSnapshot,
    orderBy,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../contexts/AuthContext";
import { Asset, Debt, NetWorthSnapshot } from "../types";
import AssetForm from "./AssetForm";
import DebtForm from "./DebtForm";
import AssetManagementModal from "./AssetManagementModal";
import DebtManagementModal from "./DebtManagementModal";
import NetWorthChart from "./NetWorthChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const Dashboard: React.FC = () => {
    const { currentUser } = useAuth();
    const [assets, setAssets] = useState<Asset[]>([]);
    const [debts, setDebts] = useState<Debt[]>([]);
    const [netWorthHistory, setNetWorthHistory] = useState<NetWorthSnapshot[]>(
        []
    );
    const [showAssetForm, setShowAssetForm] = useState(false);
    const [showDebtForm, setShowDebtForm] = useState(false);
    const [showAssetManagement, setShowAssetManagement] = useState(false);
    const [showDebtManagement, setShowDebtManagement] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentUser) return;

        let loadingCountdown = 3; // Track when all 3 queries have completed
        const setLoadingComplete = () => {
            loadingCountdown--;
            if (loadingCountdown <= 0) {
                setLoading(false);
            }
        };

        // Set a timeout to ensure loading doesn't hang forever
        const loadingTimeout = setTimeout(() => {
            console.log("Dashboard loading timeout - forcing completion");
            setLoading(false);
        }, 5000);

        const unsubscribeAssets = onSnapshot(
            query(
                collection(db, "assets"),
                where("userId", "==", currentUser.id),
                orderBy("createdAt", "desc")
            ),
            {
                next: (snapshot) => {
                    const assetsData = snapshot.docs.map((doc) => ({
                        id: doc.id,
                        ...doc.data(),
                        createdAt: doc.data().createdAt.toDate(),
                        updatedAt: doc.data().updatedAt.toDate(),
                    })) as Asset[];
                    setAssets(assetsData);
                    setLoadingComplete();
                },
                error: (error) => {
                    console.error("Assets query error:", error);
                    setAssets([]);
                    setLoadingComplete();
                },
            }
        );

        const unsubscribeDebts = onSnapshot(
            query(
                collection(db, "debts"),
                where("userId", "==", currentUser.id),
                orderBy("createdAt", "desc")
            ),
            {
                next: (snapshot) => {
                    const debtsData = snapshot.docs.map((doc) => ({
                        id: doc.id,
                        ...doc.data(),
                        createdAt: doc.data().createdAt.toDate(),
                        updatedAt: doc.data().updatedAt.toDate(),
                    })) as Debt[];
                    setDebts(debtsData);
                    setLoadingComplete();
                },
                error: (error) => {
                    console.error("Debts query error:", error);
                    setDebts([]);
                    setLoadingComplete();
                },
            }
        );

        const unsubscribeNetWorth = onSnapshot(
            query(
                collection(db, "netWorthSnapshots"),
                where("userId", "==", currentUser.id),
                orderBy("createdAt", "desc")
            ),
            {
                next: (snapshot) => {
                    const historyData = snapshot.docs.map((doc) => ({
                        id: doc.id,
                        ...doc.data(),
                        createdAt: doc.data().createdAt.toDate(),
                    })) as NetWorthSnapshot[];
                    setNetWorthHistory(historyData);
                    setLoadingComplete();
                },
                error: (error) => {
                    console.error("NetWorth history query error:", error);
                    setNetWorthHistory([]);
                    setLoadingComplete();
                },
            }
        );

        return () => {
            clearTimeout(loadingTimeout);
            unsubscribeAssets();
            unsubscribeDebts();
            unsubscribeNetWorth();
        };
    }, [currentUser]);

    const totalAssets = assets.reduce((sum, asset) => sum + asset.value, 0);
    const totalDebts = debts.reduce((sum, debt) => sum + debt.amount, 0);
    const netWorth = totalAssets - totalDebts;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
        }).format(amount);
    };

    const stats = [
        {
            label: "Total Assets",
            value: formatCurrency(totalAssets),
            icon: TrendingUp,
            color: "text-success",
            bgColor: "bg-success/10",
        },
        {
            label: "Total Debts",
            value: formatCurrency(totalDebts),
            icon: TrendingDown,
            color: "text-destructive",
            bgColor: "bg-destructive/10",
        },
        {
            label: "Net Worth",
            value: formatCurrency(netWorth),
            icon: netWorth >= 0 ? Target : Activity,
            color: netWorth >= 0 ? "text-primary" : "text-destructive",
            bgColor: netWorth >= 0 ? "bg-primary/10" : "bg-destructive/10",
        },
    ];

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="loading-spinner"></div>
            </div>
        );
    }

    // Check if this is a new user with no data
    const isNewUser =
        assets.length === 0 &&
        debts.length === 0 &&
        netWorthHistory.length === 0;

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {/* New User Welcome */}
                {isNewUser && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="mb-8"
                    >
                        <Card className="mx-auto max-w-2xl">
                            <CardContent className="text-center py-16 px-8">
                                <motion.div
                                    initial={{ scale: 0.8 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.2, duration: 0.4 }}
                                    className="mb-6"
                                >
                                    <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                        <TrendingUp className="w-10 h-10 text-white" />
                                    </div>
                                </motion.div>
                                <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                    Welcome to Tally!
                                </h1>
                                <p className="text-muted-foreground text-lg mb-8 max-w-lg mx-auto leading-relaxed">
                                    Start tracking your financial journey by
                                    adding your first asset or debt. Watch your
                                    net worth grow over time with beautiful
                                    charts and insights.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
                                    <motion.div
                                        whileTap={{ scale: 0.98 }}
                                        className="flex-1"
                                    >
                                        <Button
                                            onClick={() =>
                                                setShowAssetForm(true)
                                            }
                                            size="lg"
                                            className="w-full gap-2 h-12"
                                        >
                                            <Plus className="w-5 h-5" />
                                            Add Your First Asset
                                        </Button>
                                    </motion.div>
                                    <motion.div
                                        whileTap={{ scale: 0.98 }}
                                        className="flex-1"
                                    >
                                        <Button
                                            onClick={() =>
                                                setShowDebtForm(true)
                                            }
                                            variant="outline"
                                            size="lg"
                                            className="w-full gap-2 h-12"
                                        >
                                            <CreditCard className="w-5 h-5" />
                                            Add a Debt
                                        </Button>
                                    </motion.div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

                {/* Stats Grid */}
                {!isNewUser && (
                    <motion.div
                        className="grid grid-cols-1 md:grid-cols-3 gap-6"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        {stats.map((stat, index) => {
                            const Icon = stat.icon;
                            return (
                                <motion.div
                                    key={stat.label}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{
                                        delay: index * 0.1,
                                        duration: 0.5,
                                    }}
                                >
                                    <Card className="hover:shadow-lg transition-all duration-200">
                                        <CardContent className="p-6">
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-1">
                                                    <p className="text-sm font-medium text-muted-foreground">
                                                        {stat.label}
                                                    </p>
                                                    <p
                                                        className={`text-2xl font-bold ${stat.color}`}
                                                    >
                                                        {stat.value}
                                                    </p>
                                                </div>
                                                <div
                                                    className={`w-12 h-12 rounded-lg ${stat.bgColor} flex items-center justify-center`}
                                                >
                                                    <Icon
                                                        className={`w-6 h-6 ${stat.color}`}
                                                    />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                )}

                {/* Net Worth Chart */}
                {netWorthHistory.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                        className="mt-8"
                    >
                        <Card>
                            <CardHeader className="pb-4">
                                <CardTitle className="text-xl">
                                    Net Worth Trend
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <NetWorthChart data={netWorthHistory} />
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

                {/* Management Actions */}
                {!isNewUser && (
                    <motion.div
                        className="grid grid-cols-1 md:grid-cols-2 gap-6"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.5 }}
                    >
                        {/* Assets Management Card */}
                        <motion.div whileTap={{ scale: 0.98 }}>
                            <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 border-success/20 hover:border-success/40">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                                                <TrendingUp className="w-6 h-6 text-success" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-lg">
                                                    Assets
                                                </h3>
                                                <p className="text-sm text-muted-foreground">
                                                    {assets.length} item
                                                    {assets.length !== 1
                                                        ? "s"
                                                        : ""}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-bold text-success">
                                                {formatCurrency(totalAssets)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setShowAssetForm(true);
                                            }}
                                            size="sm"
                                            className="gap-2 flex-1"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Add Asset
                                        </Button>
                                        <Button
                                            onClick={() =>
                                                setShowAssetManagement(true)
                                            }
                                            variant="outline"
                                            size="sm"
                                            className="gap-2 flex-1"
                                        >
                                            Manage All
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>

                        {/* Debts Management Card */}
                        <motion.div whileTap={{ scale: 0.98 }}>
                            <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 border-destructive/20 hover:border-destructive/40">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-destructive/10 rounded-lg flex items-center justify-center">
                                                <CreditCard className="w-6 h-6 text-destructive" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-lg">
                                                    Debts
                                                </h3>
                                                <p className="text-sm text-muted-foreground">
                                                    {debts.length} item
                                                    {debts.length !== 1
                                                        ? "s"
                                                        : ""}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-bold text-destructive">
                                                {formatCurrency(totalDebts)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setShowDebtForm(true);
                                            }}
                                            size="sm"
                                            variant="destructive"
                                            className="gap-2 flex-1"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Add Debt
                                        </Button>
                                        <Button
                                            onClick={() =>
                                                setShowDebtManagement(true)
                                            }
                                            variant="outline"
                                            size="sm"
                                            className="gap-2 flex-1"
                                        >
                                            Manage All
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </motion.div>
                )}

                {/* Modals */}
                <AssetForm
                    open={showAssetForm}
                    onClose={() => setShowAssetForm(false)}
                    onSuccess={() => setShowAssetForm(false)}
                />
                <DebtForm
                    open={showDebtForm}
                    onClose={() => setShowDebtForm(false)}
                    onSuccess={() => setShowDebtForm(false)}
                />
                <AssetManagementModal
                    assets={assets}
                    open={showAssetManagement}
                    onClose={() => setShowAssetManagement(false)}
                    onRefresh={() => {
                        // Assets will auto-refresh via real-time listeners
                    }}
                />
                <DebtManagementModal
                    debts={debts}
                    open={showDebtManagement}
                    onClose={() => setShowDebtManagement(false)}
                    onRefresh={() => {
                        // Debts will auto-refresh via real-time listeners
                    }}
                />
            </div>
        </div>
    );
};

export default Dashboard;
