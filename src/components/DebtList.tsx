import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
    Edit,
    Trash2,
    CreditCard,
    BarChart3,
    ExternalLink,
} from "lucide-react";
import { doc, deleteDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useBackendRateLimit } from "../hooks/useBackendRateLimit";
import { Debt } from "../types";
import DebtForm from "./DebtForm";
import ValueHistoryModal from "./ValueHistoryModal";
import toast from "react-hot-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

interface DebtListProps {
    debts: Debt[];
}

const DebtList: React.FC<DebtListProps> = ({ debts }) => {
    const { checkRateLimit } = useBackendRateLimit();
    const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [viewingHistoryDebt, setViewingHistoryDebt] = useState<Debt | null>(
        null
    );
    const [debtToDelete, setDebtToDelete] = useState<Debt | null>(null);

    const handleDeleteClick = async (debt: Debt) => {
        const rateLimitPassed = await checkRateLimit("delete-item");
        if (!rateLimitPassed) return;
        setDebtToDelete(debt);
    };

    const handleDeleteConfirm = async () => {
        if (!debtToDelete) return;

        setDeletingId(debtToDelete.id);
        try {
            await deleteDoc(doc(db, "debts", debtToDelete.id));
            toast.success("Debt deleted successfully!");
        } catch (error) {
            console.error("Error deleting debt:", error);
            toast.error("Failed to delete debt. Please try again.");
        } finally {
            setDeletingId(null);
            setDebtToDelete(null);
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
            credit_card: "Credit Card",
            student_loan: "Student Loan",
            mortgage: "Mortgage",
            car_loan: "Car Loan",
            personal_loan: "Personal Loan",
            other: "Other",
        };
        return labels[category] || category;
    };

    return (
        <>
            <Card>
                <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-destructive/10 rounded-lg flex items-center justify-center">
                            <CreditCard className="w-6 h-6 text-destructive" />
                        </div>
                        <div>
                            <CardTitle className="text-xl font-semibold">
                                Debts
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                                {debts.length} item
                                {debts.length !== 1 ? "s" : ""}
                            </p>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="space-y-4 pt-0">
                    <AnimatePresence>
                        {debts.map((debt, index) => (
                            <motion.div
                                key={debt.id}
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
                                                        {debt.name}
                                                    </h3>
                                                    <Badge
                                                        variant="secondary"
                                                        className="text-destructive bg-destructive/10"
                                                    >
                                                        {getCategoryLabel(
                                                            debt.category
                                                        )}
                                                    </Badge>
                                                </div>
                                                <p className="text-lg font-bold text-destructive">
                                                    {formatCurrency(
                                                        debt.amount
                                                    )}
                                                </p>
                                                {debt.interestRate && (
                                                    <p className="text-sm text-muted-foreground">
                                                        {debt.interestRate}%
                                                        interest
                                                    </p>
                                                )}
                                                {debt.description && (
                                                    <p className="text-sm text-muted-foreground mt-1 truncate">
                                                        {debt.description}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {debt.url && (
                                                    <motion.div
                                                        whileTap={{
                                                            scale: 0.9,
                                                        }}
                                                    >
                                                        <Button
                                                            onClick={() =>
                                                                window.open(
                                                                    debt.url,
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
                                                            setViewingHistoryDebt(
                                                                debt
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
                                                            setEditingDebt(debt)
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
                                                                debt
                                                            )
                                                        }
                                                        disabled={
                                                            deletingId ===
                                                            debt.id
                                                        }
                                                        variant="ghost"
                                                        size="sm"
                                                        className="p-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                    >
                                                        {deletingId ===
                                                        debt.id ? (
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

                    {debts.length === 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                        >
                            <Card className="border-dashed">
                                <CardContent className="text-center py-12">
                                    <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                                        No Debts Yet
                                    </h3>
                                    <p className="text-muted-foreground">
                                        Add debts to get a complete picture of
                                        your net worth
                                    </p>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}
                </CardContent>
            </Card>

            <DebtForm
                open={!!editingDebt}
                debt={editingDebt || undefined}
                onClose={() => setEditingDebt(null)}
                onSuccess={() => setEditingDebt(null)}
            />
            {viewingHistoryDebt && (
                <ValueHistoryModal
                    open={!!viewingHistoryDebt}
                    item={viewingHistoryDebt}
                    type="debt"
                    onClose={() => setViewingHistoryDebt(null)}
                    onValueUpdate={() => {
                        // The debt list will automatically update through the realtime listener
                        // No need to manually update state here
                    }}
                />
            )}
            <ConfirmationDialog
                open={!!debtToDelete}
                onClose={() => setDebtToDelete(null)}
                onConfirm={handleDeleteConfirm}
                title="Delete Debt"
                description={`Are you sure you want to delete "${debtToDelete?.name}"? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                destructive={true}
                loading={!!deletingId}
            />
        </>
    );
};

export default DebtList;
