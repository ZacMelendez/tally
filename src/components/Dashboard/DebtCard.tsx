import { Debt } from "@/types";
import { Card, CardContent } from "../ui/card";
import { formatCurrency } from "@/utils";
import { ChevronDown, TrendingDown } from "lucide-react";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "../ui/accordion";
import { ResponsiveContainer, Pie, PieChart, Tooltip, Cell } from "recharts";

export const DebtCard = ({ debts }: { debts: Debt[] }) => {
    const totalDebts = debts.reduce((sum, debt) => sum + debt.amount, 0);

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-popover p-4 rounded-lg border border-border shadow-lg">
                    <p className="text-foreground font-semibold">
                        {data.name}: {formatCurrency(data.amount)}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <Card className="hover:shadow-lg transition-all duration-200 m-0 p-0 h-fit">
            <CardContent className="p-6">
                <Accordion type="single" collapsible>
                    <AccordionItem value="debts">
                        <AccordionTrigger className="flex items-center justify-between group cursor-pointer">
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">
                                    Total Debts
                                </p>
                                <p
                                    className={`text-2xl font-bold text-destructive`}
                                >
                                    {formatCurrency(totalDebts)}
                                </p>
                            </div>
                            <div
                                className={`relative w-12 h-12 rounded-lg bg-destructive/10 flex items-center justify-center overflow-hidden hover:bg-destructive/20`}
                            >
                                <>
                                    <TrendingDown
                                        className={`w-6 h-6 text-destructive will-change-transform opacity-100 group-hover:-translate-y-10 group-hover:opacity-0 transition-all duration-300 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2`}
                                    />
                                    <ChevronDown
                                        className={`w-6 h-6 text-destructive will-change-transform group-hover:-translate-y-1/2 transition-all duration-300 opacity-0 group-hover:opacity-100 absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-10`}
                                    />
                                </>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="p-0">
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart width={730} height={250}>
                                    <Tooltip content={<CustomTooltip />} />

                                    <Pie
                                        data={debts}
                                        dataKey="amount"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={100}
                                        isAnimationActive={false}
                                    >
                                        {debts.map((_entry, index) => (
                                            <Cell
                                                key={_entry.id}
                                                style={{
                                                    outline: "none",
                                                    stroke: "none",
                                                }}
                                                fill={
                                                    colors[
                                                        index % colors.length
                                                    ]
                                                }
                                            />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </CardContent>
        </Card>
    );
};

const colors = [
    "#8884d8",
    "#82ca9d",
    "#FFBB28",
    "#FF8042",
    "#AF19FF",
    "#FF6384",
    "#36A2EB",
    "#FF9F40",
    "#9966FF",
    "#FF9F40",
];
