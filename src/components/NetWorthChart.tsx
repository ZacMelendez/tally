import React from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { NetWorthSnapshot } from "../types";
import { Activity } from "lucide-react";

const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
};

interface NetWorthChartProps {
    data: NetWorthSnapshot[];
}

const NetWorthChart: React.FC<NetWorthChartProps> = ({ data }) => {
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    // Group data by day and use the latest snapshot for each day
    const groupedByDay = data.reduce((acc, snapshot) => {
        const dateKey = new Date(snapshot.createdAt).toLocaleDateString(
            "en-US",
            {
                year: "numeric",
                month: "short",
                day: "numeric",
            }
        );

        // If we don't have this day yet, or this snapshot is more recent, use it
        if (
            !acc[dateKey] ||
            new Date(snapshot.createdAt) > new Date(acc[dateKey].createdAt)
        ) {
            acc[dateKey] = snapshot;
        }

        return acc;
    }, {} as Record<string, NetWorthSnapshot>);

    let chartData = Object.values(groupedByDay)
        .sort(
            (a, b) =>
                new Date(a.createdAt).getTime() -
                new Date(b.createdAt).getTime()
        )
        .map((snapshot) => ({
            date: new Date(snapshot.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
            }),
            netWorth: snapshot.netWorth,
            assets: snapshot.totalAssets,
            debts: snapshot.totalDebts,
            fullDate: snapshot.createdAt,
        }));

    // If there's no change from day to day, only show the most recent day
    if (chartData.length > 1) {
        const hasChange = chartData.some((item, index) => {
            if (index === 0) return false;
            return item.netWorth !== chartData[index - 1].netWorth;
        });

        if (!hasChange) {
            chartData = [chartData[chartData.length - 1]];
        }
    }

    // Calculate y-axis domain with padding
    const netWorthValues = chartData.map((item) => item.netWorth);
    const minNetWorth = Math.min(...netWorthValues);
    const maxNetWorth = Math.max(...netWorthValues);
    const range = maxNetWorth - minNetWorth;
    const padding = range * 0.1; // 10% padding

    const yAxisDomain = [
        Math.max(0, minNetWorth - padding), // Don't go below 0
        maxNetWorth + padding,
    ];

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-popover p-4 rounded-lg border border-border shadow-lg">
                    <p className="text-muted-foreground text-sm mb-2">
                        {formatDate(data.fullDate)}
                    </p>
                    <div className="space-y-1">
                        <p className="text-primary font-semibold">
                            Net Worth: {formatCurrency(data.netWorth)}
                        </p>
                        <p className="text-success text-sm">
                            Assets: {formatCurrency(data.assets)}
                        </p>
                        <p className="text-destructive text-sm">
                            Debts: {formatCurrency(data.debts)}
                        </p>
                    </div>
                </div>
            );
        }
        return null;
    };

    const latestValue = data[0]?.netWorth || 0;
    const previousValue = data[1]?.netWorth || 0;
    const change = latestValue - previousValue;
    const changePercent =
        previousValue !== 0 ? (change / Math.abs(previousValue)) * 100 : 0;

    return (
        <div className="bg-card border border-success/20 hover:border-success/40 rounded-lg p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.05)] border-none">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Activity className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-foreground">
                            Daily Net Worth History
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Track your daily financial progress over time
                        </p>
                    </div>
                </div>

                {data.length > 1 && (
                    <div className="text-right">
                        <p className="text-sm text-muted-foreground">
                            Recent Change
                        </p>
                        <p
                            className={`font-semibold ${
                                change >= 0
                                    ? "text-success"
                                    : "text-destructive"
                            }`}
                        >
                            {change >= 0 ? "+" : ""}
                            {formatCurrency(change)}
                        </p>
                        <p
                            className={`text-xs ${
                                change >= 0
                                    ? "text-success"
                                    : "text-destructive"
                            }`}
                        >
                            {change >= 0 ? "+" : ""}
                            {changePercent.toFixed(1)}%
                        </p>
                    </div>
                )}
            </div>

            {chartData.length > 1 ? (
                <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={chartData}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="rgba(255, 255, 255, 0.1)"
                            />
                            <XAxis
                                dataKey="date"
                                stroke="rgba(255, 255, 255, 0.7)"
                                fontSize={12}
                                tick={{ fill: "rgba(255, 255, 255, 0.7)" }}
                            />
                            <YAxis
                                domain={yAxisDomain}
                                stroke="rgba(255, 255, 255, 0.7)"
                                fontSize={12}
                                tickFormatter={formatCurrency}
                                tick={{ fill: "rgba(255, 255, 255, 0.7)" }}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Line
                                type="monotone"
                                dataKey="netWorth"
                                stroke="#3b82f6"
                                strokeWidth={3}
                                dot={{
                                    fill: "#3b82f6",
                                    stroke: "#1e40af",
                                    strokeWidth: 2,
                                    r: 4,
                                }}
                                activeDot={{
                                    r: 6,
                                    fill: "#3b82f6",
                                    stroke: "#1e40af",
                                    strokeWidth: 2,
                                }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            ) : (
                <div className="h-80 flex items-center justify-center">
                    <div className="text-center">
                        <Activity className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                            {chartData.length === 1
                                ? "Current Net Worth"
                                : "Building Your History"}
                        </h3>
                        <p className="text-muted-foreground max-w-md">
                            {chartData.length === 1
                                ? `Your current net worth is ${formatCurrency(
                                      chartData[0]?.netWorth || 0
                                  )}. Add more data to see trends over time.`
                                : "Keep adding and updating your assets and debts to see your net worth trends over time."}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NetWorthChart;
