import React, { useState, useEffect, useCallback } from "react";
import { Plus, TrendingUp, TrendingDown, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Asset, Debt, AssetValueHistory, DebtValueHistory } from "../types";
import { apiService } from "../services/apiService";
import { useAuth } from "../contexts/AuthContext";
import { useBackendRateLimit } from "../hooks/useBackendRateLimit";
import toast from "react-hot-toast";
import { Line } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ChartOptions,
} from "chart.js";

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

interface ValueHistoryModalProps {
    item: Asset | Debt;
    type: "asset" | "debt";
    open: boolean;
    onClose: () => void;
    onValueUpdate?: (newValue: number) => void;
}

type ValueHistoryEntry = AssetValueHistory | DebtValueHistory;

const ValueHistoryModal: React.FC<ValueHistoryModalProps> = ({
    item,
    type,
    open,
    onClose,
    onValueUpdate,
}) => {
    const { currentUser } = useAuth();
    const { checkRateLimit } = useBackendRateLimit();
    const [history, setHistory] = useState<ValueHistoryEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newValue, setNewValue] = useState("");
    const [newNote, setNewNote] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const loadHistory = useCallback(async () => {
        if (!currentUser) return;

        try {
            setLoading(true);
            let historyData: ValueHistoryEntry[];

            if (type === "asset") {
                historyData = await apiService.getAssetHistory(item.id);
            } else {
                historyData = await apiService.getDebtHistory(item.id);
            }

            setHistory(historyData);
        } catch (error) {
            console.error("Error loading history:", error);
            toast.error("Failed to load value history");
        } finally {
            setLoading(false);
        }
    }, [item.id, currentUser, type]);

    useEffect(() => {
        loadHistory();
    }, [item.id, currentUser, loadHistory]);

    const handleAddValue = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!currentUser) return;

        const rateLimitPassed = await checkRateLimit("add-asset");
        if (!rateLimitPassed) return;

        const value = parseFloat(newValue);
        if (isNaN(value) || value < 0) {
            toast.error("Please enter a valid positive value");
            return;
        }

        setSubmitting(true);
        try {
            if (type === "asset") {
                await apiService.addAssetHistory(item.id, {
                    value,
                    note: newNote,
                });
            } else {
                await apiService.addDebtHistory(item.id, {
                    value,
                    note: newNote,
                });
            }

            toast.success(
                `${
                    type === "asset" ? "Asset" : "Debt"
                } value updated successfully!`
            );

            await loadHistory();
            onValueUpdate?.(value);

            setNewValue("");
            setNewNote("");
            setShowAddForm(false);
        } catch (error) {
            console.error("Error adding value history:", error);
            toast.error("Failed to update value");
        } finally {
            setSubmitting(false);
        }
    };

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
        }).format(amount);

    const formatDate = (date: string) =>
        new Intl.DateTimeFormat("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }).format(new Date(date));

    const formatDateShort = (date: string) =>
        new Intl.DateTimeFormat("en-US", {
            month: "short",
            day: "numeric",
        }).format(new Date(date));

    // Prepare chart data
    const chartData = {
        labels: history
            .slice()
            .reverse()
            .map((entry) => formatDateShort(String(entry.createdAt))),
        datasets: [
            {
                label: `${type === "asset" ? "Asset" : "Debt"} Value`,
                data: history
                    .slice()
                    .reverse()
                    .map((entry) =>
                        type === "asset"
                            ? (entry as AssetValueHistory).value
                            : (entry as DebtValueHistory).amount
                    ),
                borderColor: type === "asset" ? "#10b981" : "#ef4444",
                backgroundColor: type === "asset" ? "#10b981" : "#ef4444",
                tension: 0.1,
                pointRadius: 4,
                pointHoverRadius: 6,
            },
        ],
    };

    const chartOptions: ChartOptions<"line"> = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                mode: "index",
                intersect: false,
                backgroundColor: "rgba(0, 0, 0, 0.8)",
                titleColor: "white",
                bodyColor: "white",
                borderColor: type === "asset" ? "#10b981" : "#ef4444",
                borderWidth: 1,
                callbacks: {
                    label: (context) => {
                        return formatCurrency(context.parsed.y);
                    },
                },
            },
        },
        scales: {
            x: {
                grid: {
                    color: "rgba(255, 255, 255, 0.1)",
                },
                ticks: {
                    color: "rgba(255, 255, 255, 0.7)",
                },
            },
            y: {
                grid: {
                    color: "rgba(255, 255, 255, 0.1)",
                },
                ticks: {
                    color: "rgba(255, 255, 255, 0.7)",
                    callback: (value) => {
                        return formatCurrency(Number(value));
                    },
                },
            },
        },
        interaction: {
            mode: "index" as const,
            intersect: false,
        },
    };

    const currentValue =
        type === "asset" ? (item as Asset).value : (item as Debt).amount;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] min-w-1/2 overflow-hidden border-success/20 hover:border-success/40">
                <DialogHeader className="pb-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div
                                className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                                    type === "asset"
                                        ? "bg-success/10"
                                        : "bg-destructive/10"
                                }`}
                            >
                                {type === "asset" ? (
                                    <TrendingUp
                                        className={`w-6 h-6 text-success`}
                                    />
                                ) : (
                                    <TrendingDown
                                        className={`w-6 h-6 text-destructive`}
                                    />
                                )}
                            </div>
                            <div>
                                <DialogTitle className="text-xl">
                                    {item.name} - Value History
                                </DialogTitle>
                                <div className="flex items-center gap-2 mt-1">
                                    <Badge
                                        variant="secondary"
                                        className={
                                            type === "asset"
                                                ? "text-success bg-success/10"
                                                : "text-destructive bg-destructive/10"
                                        }
                                    >
                                        {type === "asset" ? "Asset" : "Debt"}
                                    </Badge>
                                    <span className="text-sm text-muted-foreground">
                                        Current: {formatCurrency(currentValue)}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <Button
                            onClick={() => setShowAddForm(true)}
                            size="sm"
                            className="gap-2"
                            variant="outline"
                        >
                            <Plus className="w-4 h-4" />
                            Update Value
                        </Button>
                    </div>
                </DialogHeader>

                <div className="space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                    {history.length > 1 && (
                        <div className="h-64 w-full">
                            <Line data={chartData} options={chartOptions} />
                        </div>
                    )}

                    {showAddForm && (
                        <Card className="border-2 border-dashed">
                            <CardContent className="p-4">
                                <form
                                    onSubmit={handleAddValue}
                                    className="space-y-4"
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="newValue">
                                                New{" "}
                                                {type === "asset"
                                                    ? "Value"
                                                    : "Amount"}{" "}
                                                *
                                            </Label>
                                            <Input
                                                id="newValue"
                                                type="number"
                                                value={newValue}
                                                onChange={(e) =>
                                                    setNewValue(e.target.value)
                                                }
                                                placeholder="0.00"
                                                min="0"
                                                step="0.01"
                                                required
                                                disabled={submitting}
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="newNote">
                                                Note (Optional)
                                            </Label>
                                            <Input
                                                id="newNote"
                                                value={newNote}
                                                onChange={(e) =>
                                                    setNewNote(e.target.value)
                                                }
                                                placeholder="e.g., Market update, Payment made"
                                                disabled={submitting}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-2 justify-end">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={() =>
                                                setShowAddForm(false)
                                            }
                                            disabled={submitting}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={submitting}
                                            className={
                                                type === "asset"
                                                    ? ""
                                                    : "bg-destructive hover:bg-destructive/90"
                                            }
                                        >
                                            {submitting ? (
                                                <div className="loading-spinner w-4 h-4" />
                                            ) : (
                                                "Add Entry"
                                            )}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    )}

                    <div>
                        <h3 className="text-lg font-semibold mb-4">
                            Value History ({history.length} entries)
                        </h3>
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="loading-spinner" />
                            </div>
                        ) : history.length === 0 ? (
                            <Card className="border-dashed">
                                <CardContent className="text-center py-8">
                                    <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                                        No History Yet
                                    </h3>
                                    <p className="text-muted-foreground">
                                        Start tracking value changes by adding
                                        your first entry.
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="max-h-80 overflow-y-auto">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="sticky top-0 bg-background">
                                            <tr className="border-b border-border">
                                                <th className="text-left py-2 px-3 font-semibold">
                                                    Date
                                                </th>
                                                <th className="text-right py-2 px-3 font-semibold">
                                                    {type === "asset"
                                                        ? "Value"
                                                        : "Amount"}
                                                </th>
                                                <th className="text-center py-2 px-3 font-semibold">
                                                    Change
                                                </th>
                                                <th className="text-left py-2 px-3 font-semibold">
                                                    Note
                                                </th>
                                                <th className="text-center py-2 px-3 font-semibold">
                                                    Status
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {history.map((entry, index) => {
                                                const value =
                                                    type === "asset"
                                                        ? (
                                                              entry as AssetValueHistory
                                                          ).value
                                                        : (
                                                              entry as DebtValueHistory
                                                          ).amount;
                                                const prevValue =
                                                    index < history.length - 1
                                                        ? type === "asset"
                                                            ? (
                                                                  history[
                                                                      index + 1
                                                                  ] as AssetValueHistory
                                                              ).value
                                                            : (
                                                                  history[
                                                                      index + 1
                                                                  ] as DebtValueHistory
                                                              ).amount
                                                        : null;
                                                const change = prevValue
                                                    ? value - prevValue
                                                    : null;
                                                const changePercent = prevValue
                                                    ? (change! / prevValue) *
                                                      100
                                                    : null;

                                                return (
                                                    <tr
                                                        key={entry.id}
                                                        className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                                                    >
                                                        <td className="py-2 px-3">
                                                            <div className="text-sm">
                                                                {formatDate(
                                                                    String(
                                                                        entry.createdAt
                                                                    )
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="py-2 px-3 text-right">
                                                            <span
                                                                className={`font-bold ${
                                                                    type ===
                                                                    "asset"
                                                                        ? "text-success"
                                                                        : "text-destructive"
                                                                }`}
                                                            >
                                                                {formatCurrency(
                                                                    value
                                                                )}
                                                            </span>
                                                        </td>
                                                        <td className="py-2 px-3 text-center">
                                                            {change !== null ? (
                                                                <Badge
                                                                    variant={
                                                                        change >=
                                                                        0
                                                                            ? "default"
                                                                            : "destructive"
                                                                    }
                                                                    className="text-xs"
                                                                >
                                                                    {change >= 0
                                                                        ? "+"
                                                                        : ""}
                                                                    {formatCurrency(
                                                                        change
                                                                    )}
                                                                    {changePercent !==
                                                                        null && (
                                                                        <span className="ml-1">
                                                                            (
                                                                            {change >=
                                                                            0
                                                                                ? "+"
                                                                                : ""}
                                                                            {changePercent.toFixed(
                                                                                1
                                                                            )}
                                                                            %)
                                                                        </span>
                                                                    )}
                                                                </Badge>
                                                            ) : (
                                                                <span className="text-xs text-muted-foreground">
                                                                    Initial
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="py-2 px-3">
                                                            <div className="text-sm text-muted-foreground truncate max-w-48">
                                                                {entry.note
                                                                    ? `"${entry.note}"`
                                                                    : "-"}
                                                            </div>
                                                        </td>
                                                        <td className="py-2 px-3 text-center">
                                                            {index === 0 && (
                                                                <Badge
                                                                    variant="secondary"
                                                                    className="text-xs"
                                                                >
                                                                    Latest
                                                                </Badge>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ValueHistoryModal;
