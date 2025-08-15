import React, { useState, useEffect } from "react";
import { rateLimitMonitor } from "../services/rateLimitMonitorService";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";

interface HealthData {
    status: "healthy" | "degraded" | "unhealthy";
    summary: string;
    metrics: {
        totalRequests: number;
        blockedRequests: number;
        errorCount: number;
        averageResponseTime: number;
        uptime: number;
        lastHealthCheck: Date;
    };
    activeIncidents: number;
    recommendations: string[];
}

const RateLimitHealthStatus: React.FC = () => {
    const [healthData, setHealthData] = useState<HealthData | null>(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const refreshHealthData = async () => {
        setRefreshing(true);
        try {
            const report = rateLimitMonitor.generateHealthReport();
            setHealthData(report);
        } catch (error) {
            console.error("Failed to refresh health data:", error);
        } finally {
            setRefreshing(false);
        }
    };

    useEffect(() => {
        refreshHealthData();

        // Refresh every 30 seconds
        const interval = setInterval(refreshHealthData, 30000);
        return () => clearInterval(interval);
    }, []);

    if (!healthData) {
        return (
            <Card className="p-4">
                <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                    <span className="text-sm text-gray-600">
                        Loading rate limit status...
                    </span>
                </div>
            </Card>
        );
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case "healthy":
                return "bg-green-500";
            case "degraded":
                return "bg-yellow-500";
            case "unhealthy":
                return "bg-red-500";
            default:
                return "bg-gray-500";
        }
    };

    const getStatusBadgeVariant = (status: string) => {
        switch (status) {
            case "healthy":
                return "default" as const;
            case "degraded":
                return "secondary" as const;
            case "unhealthy":
                return "destructive" as const;
            default:
                return "outline" as const;
        }
    };

    const blockRate =
        healthData.metrics.totalRequests > 0
            ? (
                  (healthData.metrics.blockedRequests /
                      healthData.metrics.totalRequests) *
                  100
              ).toFixed(1)
            : "0";

    return (
        <Card className="p-4 space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div
                        className={`w-3 h-3 rounded-full ${getStatusColor(
                            healthData.status
                        )}`}
                    ></div>
                    <div>
                        <h3 className="font-medium">Rate Limiting Service</h3>
                        <p className="text-sm text-gray-600">
                            {healthData.summary}
                        </p>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <Badge variant={getStatusBadgeVariant(healthData.status)}>
                        {healthData.status.toUpperCase()}
                    </Badge>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={refreshHealthData}
                        disabled={refreshing}
                    >
                        {refreshing ? "Refreshing..." : "Refresh"}
                    </Button>
                </div>
            </div>

            {healthData.activeIncidents > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-800 font-medium">
                        ⚠️ {healthData.activeIncidents} active incident
                        {healthData.activeIncidents > 1 ? "s" : ""}
                    </p>
                </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                    <p className="text-gray-600">Total Requests</p>
                    <p className="font-medium">
                        {healthData.metrics.totalRequests.toLocaleString()}
                    </p>
                </div>
                <div>
                    <p className="text-gray-600">Block Rate</p>
                    <p className="font-medium">{blockRate}%</p>
                </div>
                <div>
                    <p className="text-gray-600">Avg Response</p>
                    <p className="font-medium">
                        {healthData.metrics.averageResponseTime.toFixed(0)}ms
                    </p>
                </div>
                <div>
                    <p className="text-gray-600">Uptime</p>
                    <p className="font-medium">
                        {healthData.metrics.uptime.toFixed(1)}%
                    </p>
                </div>
            </div>

            {(healthData.recommendations.length > 0 || isExpanded) && (
                <div className="space-y-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="p-0 h-auto font-normal text-blue-600 hover:text-blue-800"
                    >
                        {isExpanded ? "Hide Details" : "Show Details"}
                    </Button>

                    {isExpanded && (
                        <div className="space-y-3">
                            {healthData.recommendations.length > 0 && (
                                <div>
                                    <h4 className="font-medium text-sm">
                                        Recommendations:
                                    </h4>
                                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                                        {healthData.recommendations.map(
                                            (rec, index) => (
                                                <li key={index}>{rec}</li>
                                            )
                                        )}
                                    </ul>
                                </div>
                            )}

                            <div>
                                <h4 className="font-medium text-sm">
                                    Detailed Metrics:
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                    <div>
                                        <span className="text-gray-600">
                                            Blocked Requests:
                                        </span>
                                        <span className="ml-2 font-mono">
                                            {healthData.metrics.blockedRequests}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">
                                            Error Count:
                                        </span>
                                        <span className="ml-2 font-mono">
                                            {healthData.metrics.errorCount}
                                        </span>
                                    </div>
                                    <div className="md:col-span-2">
                                        <span className="text-gray-600">
                                            Last Health Check:
                                        </span>
                                        <span className="ml-2 font-mono">
                                            {healthData.metrics.lastHealthCheck.toLocaleTimeString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </Card>
    );
};

export default RateLimitHealthStatus;
