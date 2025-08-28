import React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "../contexts/AuthContext";
import { useBackendRateLimit } from "../hooks/useBackendRateLimit";
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
import { apiService } from "../services/apiService";
import toast from "react-hot-toast";
import { analyticsService } from "../services/analyticsService";
import { cn } from "@/lib/utils";

interface AssetFormProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    asset?: Asset;
}

// Zod schema for asset form validation
const assetFormSchema = z.object({
    name: z.string().min(1, "Asset name is required").trim(),
    value: z.number().min(0, "Value must be a positive number"),
    category: z.enum([
        "cash",
        "savings",
        "checking",
        "investment",
        "retirement",
        "real-estate",
        "vehicle",
        "personal-property",
        "crypto",
        "other",
    ] as const),
    description: z.string().optional(),
    url: z
        .string()
        .url("Please enter a valid URL")
        .optional()
        .or(z.literal("")),
});

type AssetFormData = z.infer<typeof assetFormSchema>;

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
    const { checkRateLimit, isLoading: rateLimitLoading } =
        useBackendRateLimit();

    const {
        register,
        handleSubmit,
        control,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<AssetFormData>({
        resolver: zodResolver(assetFormSchema),
        defaultValues: {
            name: asset?.name || "",
            value: asset?.value || 0,
            category: asset?.category || undefined,
            description: asset?.description || "",
            url: asset?.url || "",
        },
    });

    const onSubmit = async (data: AssetFormData) => {
        if (!currentUser) return;

        const action = asset ? "update-asset" : "add-asset";
        const rateLimitPassed = await checkRateLimit(action);
        if (!rateLimitPassed) return;

        try {
            const assetData = {
                name: data.name.trim(),
                value: data.value,
                category: data.category,
                description: data.description?.trim() || "",
                url: data.url?.trim() || "",
            };

            if (asset) {
                // Check if value changed to add history entry
                const valueChanged = asset.value !== data.value;

                await apiService.updateAsset(asset.id, assetData);

                // Add history entry if value changed
                if (valueChanged) {
                    try {
                        await apiService.addAssetHistory(asset.id, {
                            value: data.value,
                            note: "Value updated",
                        });
                    } catch (historyError) {
                        console.error(
                            "Error adding asset history:",
                            historyError
                        );
                        // Don't fail the update if history fails
                    }
                }

                toast.success("Asset updated successfully!");
                analyticsService.trackAssetUpdated(data.category, data.value);
            } else {
                await apiService.createAsset(assetData);

                toast.success("Asset added successfully!");
                analyticsService.trackAssetAdded(data.category, data.value);
            }

            reset();
            onSuccess();
        } catch (error) {
            console.error("Error saving asset:", error);
            toast.error("Failed to save asset. Please try again.");
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

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Asset Name *</Label>

                        <Controller
                            name="name"
                            control={control}
                            render={({ field: { ref: _ref, ...field } }) => (
                                <Input
                                    id={field.name}
                                    type="text"
                                    placeholder="e.g., Emergency Fund, 401k, House"
                                    disabled={isSubmitting}
                                    {...field}
                                />
                            )}
                        />
                        {errors.name && (
                            <p className="text-sm text-red-500">
                                {errors.name.message}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="value">Value *</Label>
                        <Controller
                            name="value"
                            control={control}
                            render={({ field: { ref: _ref, ...field } }) => (
                                <Input
                                    id={field.name}
                                    type="number"
                                    placeholder="0.00"
                                    min="0"
                                    step="0.01"
                                    disabled={isSubmitting}
                                    {...field}
                                />
                            )}
                        />

                        {errors.value && (
                            <p className="text-sm text-red-500">
                                {errors.value.message}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="category">Category *</Label>
                        <Controller
                            name="category"
                            control={control}
                            render={({ field: { ref: _ref, ...field } }) => (
                                <select
                                    id="category"
                                    {...field}
                                    disabled={isSubmitting}
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
                            )}
                        />
                        {errors.category && (
                            <p className="text-sm text-red-500">
                                {errors.category.message}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="url">Website/Account URL</Label>

                        <Controller
                            name="value"
                            control={control}
                            render={({ field: { ref: _ref, ...field } }) => (
                                <Input
                                    id={field.name}
                                    type="url"
                                    {...field}
                                    placeholder="https://example.com (optional)"
                                    disabled={isSubmitting}
                                />
                            )}
                        />
                        {errors.url && (
                            <p className="text-sm text-red-500">
                                {errors.url.message}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <textarea
                            id="description"
                            {...register("description")}
                            placeholder="Optional description..."
                            rows={3}
                            disabled={isSubmitting}
                            className={cn(
                                ...inputStyles,
                                "w-full resize-none rounded-md px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground min-h-20"
                            )}
                        />
                        {errors.description && (
                            <p className="text-sm text-red-500">
                                {errors.description.message}
                            </p>
                        )}
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            variant="outline"
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting || rateLimitLoading}
                            className="flex-1"
                        >
                            {isSubmitting || rateLimitLoading ? (
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
