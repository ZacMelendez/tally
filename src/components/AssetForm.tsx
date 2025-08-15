import React, { useState } from "react";
import { collection, addDoc, updateDoc, doc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../contexts/AuthContext";
import { useRateLimit } from "../hooks/useRateLimit";
import { Asset, AssetCategory } from "../types";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, inputStyles } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    createInitialAssetHistory,
    addAssetValueHistory,
} from "../services/valueHistoryService";
import { createSnapshotFromCurrentData } from "../services/netWorthService";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

interface AssetFormProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    asset?: Asset;
}

const ASSET_CATEGORIES: { value: AssetCategory; label: string }[] = [
    { value: "cash", label: "Cash" },
    { value: "savings", label: "Savings Account" },
    { value: "checking", label: "Checking Account" },
    { value: "investment", label: "Investment Account" },
    { value: "retirement", label: "Retirement Account" },
    { value: "real-estate", label: "Real Estate" },
    { value: "vehicle", label: "Vehicle" },
    { value: "personal-property", label: "Personal Property" },
    { value: "crypto", label: "Cryptocurrency" },
    { value: "other", label: "Other" },
];

const AssetForm: React.FC<AssetFormProps> = ({
    open,
    onClose,
    onSuccess,
    asset,
}) => {
    const { currentUser } = useAuth();
    const { checkRateLimit } = useRateLimit();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: asset?.name || "",
        value: asset?.value?.toString() || "",
        category: asset?.category || ("other" as AssetCategory),
        description: asset?.description || "",
        url: asset?.url || "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!currentUser) return;

        const action = asset ? "update-asset" : "add-asset";
        if (!checkRateLimit(action)) return;

        if (!formData.name.trim() || !formData.value.trim()) {
            toast.error("Name and value are required");
            return;
        }

        const value = parseFloat(formData.value);
        if (isNaN(value) || value < 0) {
            toast.error("Please enter a valid positive value");
            return;
        }

        setLoading(true);

        try {
            const assetData = {
                name: formData.name.trim(),
                value,
                category: formData.category,
                description: formData.description.trim(),
                url: formData.url.trim(),
                userId: currentUser.id,
                updatedAt: new Date(),
            };

            if (asset) {
                // Check if value changed to add history entry
                const valueChanged = asset.value !== value;

                await updateDoc(doc(db, "assets", asset.id), assetData);

                // Add history entry if value changed
                if (valueChanged) {
                    try {
                        await addAssetValueHistory(
                            asset.id,
                            currentUser.id,
                            value,
                            "Value updated"
                        );
                    } catch (historyError) {
                        console.error(
                            "Error adding asset history:",
                            historyError
                        );
                        // Don't fail the update if history fails
                    }
                }

                toast.success("Asset updated successfully!");

                // Create net worth snapshot after successful update
                await createSnapshotFromCurrentData(currentUser.id);
            } else {
                const docRef = await addDoc(collection(db, "assets"), {
                    ...assetData,
                    createdAt: new Date(),
                });

                // Create initial history entry for new asset
                try {
                    await createInitialAssetHistory(
                        docRef.id,
                        currentUser.id,
                        value
                    );
                } catch (historyError) {
                    console.error(
                        "Error creating initial asset history:",
                        historyError
                    );
                    // Don't fail the creation if history fails
                }

                toast.success("Asset added successfully!");

                // Create net worth snapshot after successful creation
                await createSnapshotFromCurrentData(currentUser.id);
            }

            setFormData({
                name: "",
                value: "",
                category: "other",
                description: "",
                url: "",
            });

            onSuccess();
        } catch (error) {
            console.error("Error saving asset:", error);
            toast.error("Failed to save asset. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-md border-success/20 hover:border-success/40">
                <DialogHeader>
                    <DialogTitle className="text-xl">
                        {asset ? "Edit Asset" : "Add New Asset"}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Asset Name *</Label>
                        <Input
                            id="name"
                            type="text"
                            value={formData.name}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    name: e.target.value,
                                })
                            }
                            placeholder="e.g., Emergency Fund, 401k, House"
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="value">Value *</Label>
                        <Input
                            id="value"
                            type="number"
                            value={formData.value}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    value: e.target.value,
                                })
                            }
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="category">Category *</Label>
                        <select
                            id="category"
                            value={formData.category}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    category: e.target.value as AssetCategory,
                                })
                            }
                            required
                            disabled={loading}
                            className={cn(
                                ...inputStyles,
                                "border-r-8 border-r-transparent bg-background"
                            )}
                        >
                            {ASSET_CATEGORIES.map((category) => (
                                <option
                                    key={category.value}
                                    value={category.value}
                                >
                                    {category.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="url">Website/Account URL</Label>
                        <Input
                            id="url"
                            type="url"
                            value={formData.url}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    url: e.target.value,
                                })
                            }
                            placeholder="https://example.com (optional)"
                            disabled={loading}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    description: e.target.value,
                                })
                            }
                            placeholder="Optional description..."
                            rows={3}
                            disabled={loading}
                            className={cn(
                                ...inputStyles,
                                "w-full resize-none rounded-md px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground min-h-20"
                            )}
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            variant="outline"
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="flex-1"
                        >
                            {loading ? (
                                <div className="loading-spinner" />
                            ) : asset ? (
                                "Update Asset"
                            ) : (
                                "Add Asset"
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default AssetForm;
