import React, { useState, useEffect, useCallback } from "react";
import {
    Plus,
    TrendingUp,
    TrendingDown,
    CreditCard,
    Target,
    Activity,
    RefreshCw,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { Asset, Debt, NetWorthSnapshot } from "../types";
import { analyticsService } from "../services/analyticsService";
import { apiService } from "../services/apiService";
import AssetForm from "./AssetForm";
import DebtForm from "./DebtForm";
import AssetManagementModal from "./AssetManagementModal";
import DebtManagementModal from "./DebtManagementModal";
import NetWorthChart from "./NetWorthChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

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
    const [refreshing, setRefreshing] = useState(false);

    // Track page view
    useEffect(() => {
        analyticsService.trackPageView("Dashboard");
    }, []);

    const loadData = useCallback(async () => {
        if (!currentUser) return;

        try {
            const [assetsData, debtsData, netWorthData] = await Promise.all([
                apiService.getAssets(),
                apiService.getDebts(),
                apiService.getNetWorthHistory(),
            ]);

            setAssets(assetsData);
            setDebts(debtsData);
            setNetWorthHistory(netWorthData);
        } catch (error) {
            console.error("Error loading dashboard data:", error);
            toast.error("Failed to load dashboard data");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [currentUser]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadData();
    };

    const handleAssetSuccess = () => {
        setShowAssetForm(false);
        loadData(); // Refresh data after asset operation
    };

    const handleDebtSuccess = () => {
        setShowDebtForm(false);
        loadData(); // Refresh data after debt operation
    };

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
                    <Card className="mx-auto mb-8 max-w-2xl">
                        <CardContent className="text-center py-16 px-8">
                            <div className="mb-6">
                                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                    <TrendingUp className="w-10 h-10 text-white" />
                                </div>
                            </div>
                            <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                Welcome to Tally!
                            </h1>
                            <p className="text-muted-foreground text-lg mb-8 max-w-lg mx-auto leading-relaxed">
                                Start tracking your financial journey by adding
                                your first asset or debt. Watch your net worth
                                grow over time with beautiful charts and
                                insights.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
                                <div className="flex-1">
                                    <Button
                                        onClick={() => setShowAssetForm(true)}
                                        size="lg"
                                        className="w-full gap-2 h-12"
                                    >
                                        <Plus className="w-5 h-5" />
                                        Add Your First Asset
                                    </Button>
                                </div>
                                <div className="flex-1">
                                    <Button
                                        onClick={() => setShowDebtForm(true)}
                                        variant="outline"
                                        size="lg"
                                        className="w-full gap-2 h-12"
                                    >
                                        <CreditCard className="w-5 h-5" />
                                        Add a Debt
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Refresh Button */}
                {!isNewUser && (
                    <div className="flex justify-end mb-4">
                        <Button
                            onClick={handleRefresh}
                            variant="outline"
                            size="sm"
                            disabled={refreshing}
                            className="gap-2"
                        >
                            <RefreshCw
                                className={`w-4 h-4 ${
                                    refreshing ? "animate-spin" : ""
                                }`}
                            />
                            {refreshing ? "Refreshing..." : "Refresh"}
                        </Button>
                    </div>
                )}

                {/* Stats Grid */}
                {!isNewUser && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {stats.map((stat) => {
                            const Icon = stat.icon;
                            return (
                                <div key={stat.label}>
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
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Net Worth Chart */}
                {netWorthHistory.length > 0 && (
                    <Card>
                        <CardHeader className="pb-4 mt-8">
                            <CardTitle className="text-xl">
                                Net Worth Trend
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <NetWorthChart data={netWorthHistory} />
                        </CardContent>
                    </Card>
                )}

                {/* Management Actions */}
                {!isNewUser && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                                {assets.length !== 1 ? "s" : ""}
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
                                                {debts.length !== 1 ? "s" : ""}
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
                    </div>
                )}

                {/* Modals */}
                <AssetForm
                    open={showAssetForm}
                    onClose={() => setShowAssetForm(false)}
                    onSuccess={handleAssetSuccess}
                />
                <DebtForm
                    open={showDebtForm}
                    onClose={() => setShowDebtForm(false)}
                    onSuccess={handleDebtSuccess}
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
