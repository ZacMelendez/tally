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
import { useEffect, useState } from "react";

export const DebtCard = ({ debts }: { debts: Debt[] }) => {
    const totalDebts = debts.reduce((sum, debt) => sum + debt.amount, 0);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768); // md breakpoint
        };

        checkMobile();
        window.addEventListener("resize", checkMobile);

        return () => window.removeEventListener("resize", checkMobile);
    }, []);

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
                                        className={`w-6 h-6 text-destructive will-change-transform opacity-100 group-hover:-translate-y-10 group-hover:opacity-0 transition-all duration-300 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 sm:block hidden`}
                                    />
                                    <ChevronDown
                                        className={`w-6 h-6 text-destructive will-change-transform group-hover:-translate-y-1/2 transition-all duration-300 opacity-0 group-hover:opacity-100 absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-10 group-data-[state=open]:rotate-180 sm:block hidden`}
                                    />

                                    <ChevronDown
                                        className={`w-6 h-6 text-destructive will-change-transform transition-all duration-300 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 group-data-[state=open]:rotate-180 sm:hidden block`}
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
                            {isMobile && (
                                <div className="mt-4 pt-4 border-t border-border">
                                    <h4 className="text-sm font-medium text-muted-foreground mb-3">
                                        Asset Breakdown
                                    </h4>
                                    <div className="space-y-2 max-h-32 overflow-y-auto">
                                        {debts.map((debt, index) => (
                                            <div
                                                key={debt.id}
                                                className="flex items-center space-x-3"
                                            >
                                                <div
                                                    className="w-3 h-3 rounded-full flex-shrink-0"
                                                    style={{
                                                        backgroundColor:
                                                            colors[
                                                                index %
                                                                    colors.length
                                                            ],
                                                    }}
                                                />
                                                <span className="text-sm text-foreground truncate flex-1">
                                                    {debt.name}
                                                </span>
                                                <span className="text-sm font-medium text-foreground">
                                                    {formatCurrency(
                                                        debt.amount
                                                    )}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
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
