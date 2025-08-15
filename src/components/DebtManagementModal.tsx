import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit, Trash2, CreditCard, BarChart3 } from "lucide-react";
import { doc, deleteDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useRateLimit } from "../hooks/useRateLimit";
import { Debt } from "../types";
import DebtForm from "./DebtForm";
import ValueHistoryModal from "./ValueHistoryModal";
import { createSnapshotFromCurrentData } from "../services/netWorthService";
import toast from "react-hot-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "../contexts/AuthContext";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface DebtManagementModalProps {
    debts: Debt[];
    open: boolean;
    onClose: () => void;
    onRefresh: () => void;
}

const DebtManagementModal: React.FC<DebtManagementModalProps> = ({
    debts,
    open,
    onClose,
    onRefresh,
}) => {
    const { currentUser } = useAuth();
    const { checkRateLimit } = useRateLimit();
    const [showDebtForm, setShowDebtForm] = useState(false);
    const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
    const [viewingHistoryDebt, setViewingHistoryDebt] = useState<Debt | null>(
        null
    );
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleDelete = async (debt: Debt) => {
        if (!checkRateLimit("delete-item")) return;

        if (!confirm(`Are you sure you want to delete "${debt.name}"?`)) {
            return;
        }

        setDeletingId(debt.id);
        try {
            await deleteDoc(doc(db, "debts", debt.id));
            toast.success("Debt deleted successfully!");

            // Create net worth snapshot after successful deletion
            if (currentUser) {
                await createSnapshotFromCurrentData(currentUser.id);
            }

            onRefresh();
        } catch (error) {
            console.error("Error deleting debt:", error);
            toast.error("Failed to delete debt. Please try again.");
        } finally {
            setDeletingId(null);
        }
    };

    const handleFormSuccess = () => {
        setShowDebtForm(false);
        setEditingDebt(null);
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
            "credit-card": "Credit Card",
            "student-loan": "Student Loan",
            mortgage: "Mortgage",
            "auto-loan": "Auto Loan",
            "personal-loan": "Personal Loan",
            medical: "Medical Debt",
            other: "Other",
        };
        return labels[category] || category;
    };

    const totalDebts = debts.reduce((sum, debt) => sum + debt.amount, 0);

    return (
        <>
            <Dialog open={open} onOpenChange={onClose}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden border-destructive/20 hover:border-destructive/40">
                    <DialogHeader className="pb-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-destructive/10 rounded-lg flex items-center justify-center">
                                    <CreditCard className="w-6 h-6 text-destructive" />
                                </div>
                                <div>
                                    <DialogTitle className="text-2xl">
                                        Debt Management
                                    </DialogTitle>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Badge
                                            variant="secondary"
                                            className="text-destructive bg-destructive/10"
                                        >
                                            {debts.length} debt
                                            {debts.length !== 1 ? "s" : ""}
                                        </Badge>
                                        <span className="text-sm text-muted-foreground">
                                            Total: {formatCurrency(totalDebts)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <Button
                                onClick={() => setShowDebtForm(true)}
                                variant="destructive"
                                className="gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                Add Debt
                            </Button>
                        </div>
                    </DialogHeader>

                    <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
                        {debts.length === 0 ? (
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
                                        <p className="text-muted-foreground mb-4">
                                            Add debts to get a complete picture
                                            of your net worth
                                        </p>
                                        <Button
                                            onClick={() =>
                                                setShowDebtForm(true)
                                            }
                                            variant="destructive"
                                            className="gap-2"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Add Your First Debt
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
                                                Amount
                                            </th>
                                            <th className="text-center py-3 px-2 font-semibold">
                                                Interest Rate
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
                                            {debts.map((debt, index) => (
                                                <motion.tr
                                                    key={debt.id}
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
                                                            {debt.name}
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-2">
                                                        <Badge
                                                            variant="secondary"
                                                            className="text-destructive bg-destructive/10"
                                                        >
                                                            {getCategoryLabel(
                                                                debt.category
                                                            )}
                                                        </Badge>
                                                    </td>
                                                    <td className="py-3 px-2 text-right">
                                                        <span className="font-bold text-destructive">
                                                            {formatCurrency(
                                                                debt.amount
                                                            )}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-2 text-center">
                                                        <div className="text-sm text-muted-foreground">
                                                            {debt.interestRate
                                                                ? `${debt.interestRate}%`
                                                                : "-"}
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-2">
                                                        <div className="text-sm text-muted-foreground truncate max-w-48">
                                                            {debt.description ||
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
                                                                        setViewingHistoryDebt(
                                                                            debt
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
                                                                        setEditingDebt(
                                                                            debt
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
                                                                            debt
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        deletingId ===
                                                                        debt.id
                                                                    }
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="p-2 h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
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

            <DebtForm
                open={showDebtForm}
                onClose={() => setShowDebtForm(false)}
                onSuccess={handleFormSuccess}
            />
            <DebtForm
                open={!!editingDebt}
                debt={editingDebt || undefined}
                onClose={() => setEditingDebt(null)}
                onSuccess={handleFormSuccess}
            />
            {viewingHistoryDebt && (
                <ValueHistoryModal
                    open={!!viewingHistoryDebt}
                    item={viewingHistoryDebt}
                    type="debt"
                    onClose={() => setViewingHistoryDebt(null)}
                    onValueUpdate={() => onRefresh()}
                />
            )}
        </>
    );
};

export default DebtManagementModal;
