import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit, Trash2, TrendingUp, BarChart3 } from "lucide-react";
import { doc, deleteDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useRateLimit } from "../hooks/useRateLimit";
import { Asset } from "../types";
import AssetForm from "./AssetForm";
import ValueHistoryModal from "./ValueHistoryModal";
import { createSnapshotFromCurrentData } from "../services/netWorthService";
import toast from "react-hot-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface AssetManagementModalProps {
    assets: Asset[];
    open: boolean;
    onClose: () => void;
    onRefresh: () => void;
}

// We need currentUser for creating snapshots
import { useAuth } from "../contexts/AuthContext";

const AssetManagementModal: React.FC<AssetManagementModalProps> = ({
    assets,
    open,
    onClose,
    onRefresh,
}) => {
    const { currentUser } = useAuth();
    const { checkRateLimit } = useRateLimit();
    const [showAssetForm, setShowAssetForm] = useState(false);
    const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
    const [viewingHistoryAsset, setViewingHistoryAsset] =
        useState<Asset | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleDelete = async (asset: Asset) => {
        if (!checkRateLimit("delete-item")) return;

        if (!confirm(`Are you sure you want to delete "${asset.name}"?`)) {
            return;
        }

        setDeletingId(asset.id);
        try {
            await deleteDoc(doc(db, "assets", asset.id));
            toast.success("Asset deleted successfully!");

            // Create net worth snapshot after successful deletion
            if (currentUser) {
                await createSnapshotFromCurrentData(currentUser.id);
            }

            onRefresh();
        } catch (error) {
            console.error("Error deleting asset:", error);
            toast.error("Failed to delete asset. Please try again.");
        } finally {
            setDeletingId(null);
        }
    };

    const handleFormSuccess = () => {
        setShowAssetForm(false);
        setEditingAsset(null);
        onRefresh();
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
        }).format(amount);
    };

    const getCategoryLabel = (category: string) => {
        const labels: Record<string, string> = {
            cash: "Cash",
            savings: "Savings",
            checking: "Checking",
            investment: "Investment",
            retirement: "Retirement",
            "real-estate": "Real Estate",
            vehicle: "Vehicle",
            "personal-property": "Personal Property",
            crypto: "Cryptocurrency",
            other: "Other",
        };
        return labels[category] || category;
    };

    const totalAssets = assets.reduce((sum, asset) => sum + asset.value, 0);

    return (
        <>
            <Dialog open={open} onOpenChange={onClose}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden border-success/20 hover:border-success/40">
                    <DialogHeader className="pb-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                                    <TrendingUp className="w-6 h-6 text-success" />
                                </div>
                                <div>
                                    <DialogTitle className="text-2xl">
                                        Asset Management
                                    </DialogTitle>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Badge
                                            variant="secondary"
                                            className="text-success bg-success/10"
                                        >
                                            {assets.length} asset
                                            {assets.length !== 1 ? "s" : ""}
                                        </Badge>
                                        <span className="text-sm text-muted-foreground">
                                            Total: {formatCurrency(totalAssets)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <Button
                                onClick={() => setShowAssetForm(true)}
                                className="gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                Add Asset
                            </Button>
                        </div>
                    </DialogHeader>

                    <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
                        {assets.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.2 }}
                            >
                                <Card className="border-dashed">
                                    <CardContent className="text-center py-12">
                                        <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                        <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                                            No Assets Yet
                                        </h3>
                                        <p className="text-muted-foreground mb-4">
                                            Add your first asset to start
                                            tracking your net worth!
                                        </p>
                                        <Button
                                            onClick={() =>
                                                setShowAssetForm(true)
                                            }
                                            className="gap-2"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Add Your First Asset
                                        </Button>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-border">
                                            <th className="text-left py-3 px-2 font-semibold">
                                                Name
                                            </th>
                                            <th className="text-left py-3 px-2 font-semibold">
                                                Category
                                            </th>
                                            <th className="text-right py-3 px-2 font-semibold">
                                                Value
                                            </th>
                                            <th className="text-left py-3 px-2 font-semibold">
                                                Description
                                            </th>
                                            <th className="text-center py-3 px-2 font-semibold">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <AnimatePresence>
                                            {assets.map((asset, index) => (
                                                <motion.tr
                                                    key={asset.id}
                                                    initial={{
                                                        opacity: 0,
                                                        y: 20,
                                                    }}
                                                    animate={{
                                                        opacity: 1,
                                                        y: 0,
                                                    }}
                                                    exit={{
                                                        opacity: 0,
                                                        y: -20,
                                                    }}
                                                    transition={{
                                                        delay: index * 0.05,
                                                    }}
                                                    layout
                                                    className="group border-b border-border/50 hover:bg-muted/30 transition-colors"
                                                >
                                                    <td className="py-3 px-2">
                                                        <div className="font-medium truncate max-w-48">
                                                            {asset.name}
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-2">
                                                        <Badge
                                                            variant="secondary"
                                                            className="text-success bg-success/10"
                                                        >
                                                            {getCategoryLabel(
                                                                asset.category
                                                            )}
                                                        </Badge>
                                                    </td>
                                                    <td className="py-3 px-2 text-right">
                                                        <span className="font-bold text-success">
                                                            {formatCurrency(
                                                                asset.value
                                                            )}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-2">
                                                        <div className="text-sm text-muted-foreground truncate max-w-48">
                                                            {asset.description ||
                                                                "-"}
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-2">
                                                        <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <motion.div
                                                                whileTap={{
                                                                    scale: 0.9,
                                                                }}
                                                            >
                                                                <Button
                                                                    onClick={() =>
                                                                        setViewingHistoryAsset(
                                                                            asset
                                                                        )
                                                                    }
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="p-2 h-8 w-8"
                                                                    title="View value history"
                                                                >
                                                                    <BarChart3 className="w-4 h-4" />
                                                                </Button>
                                                            </motion.div>
                                                            <motion.div
                                                                whileTap={{
                                                                    scale: 0.9,
                                                                }}
                                                            >
                                                                <Button
                                                                    onClick={() =>
                                                                        setEditingAsset(
                                                                            asset
                                                                        )
                                                                    }
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="p-2 h-8 w-8"
                                                                >
                                                                    <Edit className="w-4 h-4" />
                                                                </Button>
                                                            </motion.div>
                                                            <motion.div
                                                                whileTap={{
                                                                    scale: 0.9,
                                                                }}
                                                            >
                                                                <Button
                                                                    onClick={() =>
                                                                        handleDelete(
                                                                            asset
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        deletingId ===
                                                                        asset.id
                                                                    }
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="p-2 h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                                >
                                                                    {deletingId ===
                                                                    asset.id ? (
                                                                        <div className="loading-spinner w-4 h-4" />
                                                                    ) : (
                                                                        <Trash2 className="w-4 h-4" />
                                                                    )}
                                                                </Button>
                                                            </motion.div>
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            ))}
                                        </AnimatePresence>
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <AssetForm
                open={showAssetForm}
                onClose={() => setShowAssetForm(false)}
                onSuccess={handleFormSuccess}
            />
            <AssetForm
                open={!!editingAsset}
                asset={editingAsset || undefined}
                onClose={() => setEditingAsset(null)}
                onSuccess={handleFormSuccess}
            />
            {viewingHistoryAsset && (
                <ValueHistoryModal
                    open={!!viewingHistoryAsset}
                    item={viewingHistoryAsset}
                    type="asset"
                    onClose={() => setViewingHistoryAsset(null)}
                    onValueUpdate={() => onRefresh()}
                />
            )}
        </>
    );
};

export default AssetManagementModal;
