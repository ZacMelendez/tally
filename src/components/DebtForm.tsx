import React, { useState } from "react";
import { collection, addDoc, updateDoc, doc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../contexts/AuthContext";
import { useRateLimit } from "../hooks/useRateLimit";
import { Debt, DebtCategory } from "../types";
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
    createInitialDebtHistory,
    addDebtValueHistory,
} from "../services/valueHistoryService";
import { createSnapshotFromCurrentData } from "../services/netWorthService";
import toast from "react-hot-toast";
import { analyticsService } from "../services/analyticsService";
import { cn } from "@/lib/utils";

interface DebtFormProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    debt?: Debt;
}

const DEBT_CATEGORIES: { value: DebtCategory; label: string }[] = [
    { value: "credit-card", label: "Credit Card" },
    { value: "student-loan", label: "Student Loan" },
    { value: "mortgage", label: "Mortgage" },
    { value: "auto-loan", label: "Auto Loan" },
    { value: "personal-loan", label: "Personal Loan" },
    { value: "medical", label: "Medical Debt" },
    { value: "other", label: "Other" },
];

const DebtForm: React.FC<DebtFormProps> = ({
    open,
    onClose,
    onSuccess,
    debt,
}) => {
    const { currentUser } = useAuth();
    const { checkRateLimit } = useRateLimit();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: debt?.name || "",
        amount: debt?.amount?.toString() || "",
        category: debt?.category || ("other" as DebtCategory),
        interestRate: debt?.interestRate?.toString() || "",
        minimumPayment: debt?.minimumPayment?.toString() || "",
        description: debt?.description || "",
        url: debt?.url || "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!currentUser) return;

        const action = debt ? "update-debt" : "add-debt";
        if (!checkRateLimit(action)) return;

        if (!formData.name.trim() || !formData.amount.trim()) {
            toast.error("Name and amount are required");
            return;
        }

        const amount = parseFloat(formData.amount);
        if (isNaN(amount) || amount < 0) {
            toast.error("Please enter a valid positive amount");
            return;
        }

        const interestRate = formData.interestRate
            ? parseFloat(formData.interestRate)
            : undefined;
        if (
            interestRate !== undefined &&
            (isNaN(interestRate) || interestRate < 0)
        ) {
            toast.error("Please enter a valid interest rate");
            return;
        }

        const minimumPayment = formData.minimumPayment
            ? parseFloat(formData.minimumPayment)
            : undefined;
        if (
            minimumPayment !== undefined &&
            (isNaN(minimumPayment) || minimumPayment < 0)
        ) {
            toast.error("Please enter a valid minimum payment");
            return;
        }

        setLoading(true);

        try {
            const debtData = {
                name: formData.name.trim(),
                amount,
                category: formData.category,
                interestRate,
                minimumPayment,
                description: formData.description.trim(),
                url: formData.url.trim(),
                userId: currentUser.id,
                updatedAt: new Date(),
            };

            if (debt) {
                // Check if amount changed to add history entry
                const amountChanged = debt.amount !== amount;

                await updateDoc(doc(db, "debts", debt.id), debtData);

                // Add history entry if amount changed
                if (amountChanged) {
                    try {
                        await addDebtValueHistory(
                            debt.id,
                            currentUser.id,
                            amount,
                            "Amount updated"
                        );
                    } catch (historyError) {
                        console.error(
                            "Error adding debt history:",
                            historyError
                        );
                        // Don't fail the update if history fails
                    }
                }

                toast.success("Debt updated successfully!");
                analyticsService.trackDebtUpdated(formData.category, amount);

                // Create net worth snapshot after successful update
                await createSnapshotFromCurrentData(currentUser.id);
            } else {
                const docRef = await addDoc(collection(db, "debts"), {
                    ...debtData,
                    createdAt: new Date(),
                });

                // Create initial history entry for new debt
                try {
                    await createInitialDebtHistory(
                        docRef.id,
                        currentUser.id,
                        amount
                    );
                } catch (historyError) {
                    console.error(
                        "Error creating initial debt history:",
                        historyError
                    );
                    // Don't fail the creation if history fails
                }

                toast.success("Debt added successfully!");
                analyticsService.trackDebtAdded(
                    formData.category,
                    amount,
                    interestRate || 0
                );

                // Create net worth snapshot after successful creation
                await createSnapshotFromCurrentData(currentUser.id);
            }

            setFormData({
                name: "",
                amount: "",
                category: "other",
                interestRate: "",
                minimumPayment: "",
                description: "",
                url: "",
            });

            onSuccess();
        } catch (error) {
            console.error("Error saving debt:", error);
            toast.error("Failed to save debt. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto border-destructive/20 hover:border-destructive/40">
                <DialogHeader>
                    <DialogTitle className="text-xl">
                        {debt ? "Edit Debt" : "Add New Debt"}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Debt Name *</Label>
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
                            placeholder="e.g., Chase Credit Card, Student Loan"
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="amount">Amount Owed *</Label>
                        <Input
                            id="amount"
                            type="number"
                            value={formData.amount}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    amount: e.target.value,
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
                                    category: e.target.value as DebtCategory,
                                })
                            }
                            required
                            disabled={loading}
                            className={cn(
                                ...inputStyles,
                                "border-r-8 border-r-transparent bg-background"
                            )}
                        >
                            {DEBT_CATEGORIES.map((category) => (
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
                        <Label htmlFor="interestRate">Interest Rate (%)</Label>
                        <Input
                            id="interestRate"
                            type="number"
                            value={formData.interestRate}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    interestRate: e.target.value,
                                })
                            }
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                            disabled={loading}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="minimumPayment">Minimum Payment</Label>
                        <Input
                            id="minimumPayment"
                            type="number"
                            value={formData.minimumPayment}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    minimumPayment: e.target.value,
                                })
                            }
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                            disabled={loading}
                        />
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
                            variant="destructive"
                            className="flex-1"
                        >
                            {loading ? (
                                <div className="loading-spinner" />
                            ) : debt ? (
                                "Update Debt"
                            ) : (
                                "Add Debt"
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default DebtForm;
