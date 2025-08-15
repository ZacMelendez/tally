import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
    Edit,
    Trash2,
    TrendingUp,
    BarChart3,
    ExternalLink,
} from "lucide-react";
import { doc, deleteDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useBackendRateLimit } from "../hooks/useBackendRateLimit";
import { Asset } from "../types";
import AssetForm from "./AssetForm";
import ValueHistoryModal from "./ValueHistoryModal";
import toast from "react-hot-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

interface AssetListProps {
    assets: Asset[];
}

const AssetList: React.FC<AssetListProps> = ({ assets }) => {
    const { checkRateLimit } = useBackendRateLimit();
    const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [viewingHistoryAsset, setViewingHistoryAsset] =
        useState<Asset | null>(null);
    const [assetToDelete, setAssetToDelete] = useState<Asset | null>(null);

    const handleDeleteClick = async (asset: Asset) => {
        const rateLimitPassed = await checkRateLimit("delete-item");
        if (!rateLimitPassed) return;
        setAssetToDelete(asset);
    };

    const handleDeleteConfirm = async () => {
        if (!assetToDelete) return;

        setDeletingId(assetToDelete.id);
        try {
            await deleteDoc(doc(db, "assets", assetToDelete.id));
            toast.success("Asset deleted successfully!");
        } catch (error) {
            console.error("Error deleting asset:", error);
            toast.error("Failed to delete asset. Please try again.");
        } finally {
            setDeletingId(null);
            setAssetToDelete(null);
        }
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
            real_estate: "Real Estate",
            vehicle: "Vehicle",
            other: "Other",
        };
        return labels[category] || category;
    };

    return (
        <>
            <Card>
                <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                            <TrendingUp className="w-6 h-6 text-success" />
                        </div>
                        <div>
                            <CardTitle className="text-xl font-semibold">
                                Assets
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                                {assets.length} item
                                {assets.length !== 1 ? "s" : ""}
                            </p>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="space-y-4 pt-0">
                    <AnimatePresence>
                        {assets.map((asset, index) => (
                            <motion.div
                                key={asset.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ delay: index * 0.05 }}
                                layout
                            >
                                <Card className="group hover:shadow-md transition-all duration-200">
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="font-semibold truncate">
                                                        {asset.name}
                                                    </h3>
                                                    <Badge
                                                        variant="secondary"
                                                        className="text-success bg-success/10"
                                                    >
                                                        {getCategoryLabel(
                                                            asset.category
                                                        )}
                                                    </Badge>
                                                </div>
                                                <p className="text-lg font-bold text-success">
                                                    {formatCurrency(
                                                        asset.value
                                                    )}
                                                </p>
                                                {asset.description && (
                                                    <p className="text-sm text-muted-foreground mt-1 truncate">
                                                        {asset.description}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {asset.url && (
                                                    <motion.div
                                                        whileTap={{
                                                            scale: 0.9,
                                                        }}
                                                    >
                                                        <Button
                                                            onClick={() =>
                                                                window.open(
                                                                    asset.url,
                                                                    "_blank",
                                                                    "noopener,noreferrer"
                                                                )
                                                            }
                                                            variant="ghost"
                                                            size="sm"
                                                            className="p-2"
                                                            title="Open account link"
                                                        >
                                                            <ExternalLink className="w-4 h-4" />
                                                        </Button>
                                                    </motion.div>
                                                )}
                                                <motion.div
                                                    whileTap={{ scale: 0.9 }}
                                                >
                                                    <Button
                                                        onClick={() =>
                                                            setViewingHistoryAsset(
                                                                asset
                                                            )
                                                        }
                                                        variant="ghost"
                                                        size="sm"
                                                        className="p-2"
                                                        title="View value history"
                                                    >
                                                        <BarChart3 className="w-4 h-4" />
                                                    </Button>
                                                </motion.div>
                                                <motion.div
                                                    whileTap={{ scale: 0.9 }}
                                                >
                                                    <Button
                                                        onClick={() =>
                                                            setEditingAsset(
                                                                asset
                                                            )
                                                        }
                                                        variant="ghost"
                                                        size="sm"
                                                        className="p-2"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </Button>
                                                </motion.div>
                                                <motion.div
                                                    whileTap={{ scale: 0.9 }}
                                                >
                                                    <Button
                                                        onClick={() =>
                                                            handleDeleteClick(
                                                                asset
                                                            )
                                                        }
                                                        disabled={
                                                            deletingId ===
                                                            asset.id
                                                        }
                                                        variant="ghost"
                                                        size="sm"
                                                        className="p-2 text-destructive hover:text-destructive hover:bg-destructive/10"
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
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {assets.length === 0 && (
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
                                    <p className="text-muted-foreground">
                                        Add your first asset to start tracking
                                        your net worth!
                                    </p>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}
                </CardContent>
            </Card>

            <AssetForm
                open={!!editingAsset}
                asset={editingAsset || undefined}
                onClose={() => setEditingAsset(null)}
                onSuccess={() => setEditingAsset(null)}
            />
            {viewingHistoryAsset && (
                <ValueHistoryModal
                    open={!!viewingHistoryAsset}
                    item={viewingHistoryAsset}
                    type="asset"
                    onClose={() => setViewingHistoryAsset(null)}
                    onValueUpdate={() => {
                        // The asset list will automatically update through the realtime listener
                        // No need to manually update state here
                    }}
                />
            )}
            <ConfirmationDialog
                open={!!assetToDelete}
                onClose={() => setAssetToDelete(null)}
                onConfirm={handleDeleteConfirm}
                title="Delete Asset"
                description={`Are you sure you want to delete "${assetToDelete?.name}"? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                destructive={true}
                loading={!!deletingId}
            />
        </>
    );
};

export default AssetList;
