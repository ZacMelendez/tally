/**
 * Rate Limit Monitoring and Recovery Service
 * Provides monitoring, alerting, and recovery mechanisms for rate limiting
 */

interface RateLimitIncident {
    id: string;
    timestamp: Date;
    action: string;
    identifier: string;
    error: string;
    severity: "low" | "medium" | "high" | "critical";
    resolved: boolean;
}

interface RateLimitMetrics {
    totalRequests: number;
    blockedRequests: number;
    errorCount: number;
    averageResponseTime: number;
    uptime: number;
    lastHealthCheck: Date;
}

class RateLimitMonitorService {
    private incidents: Map<string, RateLimitIncident> = new Map();
    private metrics: RateLimitMetrics = {
        totalRequests: 0,
        blockedRequests: 0,
        errorCount: 0,
        averageResponseTime: 0,
        uptime: 100,
        lastHealthCheck: new Date(),
    };
    private healthCheckInterval: number | null = null;
    private responseTimes: number[] = [];

    constructor() {
        this.startHealthMonitoring();
        this.loadPersistedData();
    }

    /**
     * Start monitoring the rate limiting service health
     */
    private startHealthMonitoring() {
        // Check health every 5 minutes
        this.healthCheckInterval = window.setInterval(() => {
            this.performHealthCheck();
        }, 5 * 60 * 1000);
    }

    /**
     * Record a rate limit operation
     */
    recordOperation(
        action: string,
        identifier: string,
        success: boolean,
        responseTime: number,
        error?: Error
    ) {
        this.metrics.totalRequests++;

        if (!success) {
            this.metrics.blockedRequests++;
        }

        if (error) {
            this.metrics.errorCount++;
            this.recordIncident(action, identifier, error);
        }

        // Track response times (keep last 100)
        this.responseTimes.push(responseTime);
        if (this.responseTimes.length > 100) {
            this.responseTimes.shift();
        }

        this.updateAverageResponseTime();
        this.persistMetrics();
    }

    /**
     * Record a rate limiting incident
     */
    private recordIncident(action: string, identifier: string, error: Error) {
        const incident: RateLimitIncident = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date(),
            action,
            identifier,
            error: error.message,
            severity: this.determineSeverity(error),
            resolved: false,
        };

        this.incidents.set(incident.id, incident);
        this.handleIncident(incident);
    }

    /**
     * Determine incident severity based on error type
     */
    private determineSeverity(error: Error): RateLimitIncident["severity"] {
        const message = error.message.toLowerCase();

        if (message.includes("network") || message.includes("timeout")) {
            return "medium";
        }

        if (
            message.includes("authentication") ||
            message.includes("unauthorized")
        ) {
            return "high";
        }

        if (
            message.includes("service unavailable") ||
            message.includes("redis down")
        ) {
            return "critical";
        }

        return "low";
    }

    /**
     * Handle incidents based on severity
     */
    private handleIncident(incident: RateLimitIncident) {
        console.warn(`Rate limit incident [${incident.severity}]:`, incident);

        switch (incident.severity) {
            case "critical":
                this.handleCriticalIncident(incident);
                break;
            case "high":
                this.handleHighSeverityIncident(incident);
                break;
            case "medium":
                this.handleMediumSeverityIncident(incident);
                break;
            case "low":
                this.handleLowSeverityIncident(incident);
                break;
        }
    }

    /**
     * Handle critical incidents
     */
    private handleCriticalIncident(incident: RateLimitIncident) {
        // Log to external service in production
        if (import.meta.env.PROD) {
            // Would integrate with error tracking service like Sentry
            console.error("CRITICAL RATE LIMITING FAILURE:", incident);
        }

        // Force fallback mode
        localStorage.setItem("force_rate_limit_fallback", "true");

        // Auto-recovery attempt in 5 minutes
        setTimeout(() => {
            this.attemptRecovery();
        }, 5 * 60 * 1000);
    }

    /**
     * Handle high severity incidents
     */
    private handleHighSeverityIncident(incident: RateLimitIncident) {
        // Alert administrators
        console.error("High severity rate limiting issue:", incident);

        // Auto-recovery attempt in 2 minutes
        setTimeout(() => {
            this.attemptRecovery();
        }, 2 * 60 * 1000);
    }

    /**
     * Handle medium severity incidents
     */
    private handleMediumSeverityIncident(incident: RateLimitIncident) {
        console.warn("Medium severity rate limiting issue:", incident);

        // Auto-recovery attempt in 1 minute
        setTimeout(() => {
            this.attemptRecovery();
        }, 60 * 1000);
    }

    /**
     * Handle low severity incidents
     */
    private handleLowSeverityIncident(incident: RateLimitIncident) {
        console.log("Low severity rate limiting issue:", incident);
        // No immediate action needed, just log
    }

    /**
     * Attempt to recover from incidents
     */
    private async attemptRecovery() {
        try {
            // Clear fallback mode
            localStorage.removeItem("force_rate_limit_fallback");

            // Test connection
            const testResult = await this.performHealthCheck();

            if (testResult.healthy) {
                // Mark incidents as resolved
                this.incidents.forEach((incident) => {
                    if (!incident.resolved) {
                        incident.resolved = true;
                    }
                });

                console.log("Rate limiting service recovered successfully");
            }
        } catch (error) {
            console.error("Recovery attempt failed:", error);
        }
    }

    /**
     * Perform health check on rate limiting service
     */
    private async performHealthCheck(): Promise<{
        healthy: boolean;
        responseTime: number;
    }> {
        const startTime = Date.now();

        try {
            // Check if we can access Upstash
            const redisUrl = import.meta.env.VITE_UPSTASH_REDIS_REST_URL;
            const redisToken = import.meta.env.VITE_UPSTASH_REDIS_REST_TOKEN;

            if (!redisUrl || !redisToken) {
                return { healthy: false, responseTime: 0 };
            }

            // Simple ping test
            const response = await fetch(`${redisUrl}/ping`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${redisToken}`,
                    "Content-Type": "application/json",
                },
                signal: AbortSignal.timeout(5000), // 5 second timeout
            });

            const responseTime = Date.now() - startTime;
            const healthy = response.ok;

            this.metrics.lastHealthCheck = new Date();
            this.metrics.uptime = healthy ? 100 : 0;

            return { healthy, responseTime };
        } catch (error) {
            const responseTime = Date.now() - startTime;
            console.error("Health check failed:", error);

            this.metrics.lastHealthCheck = new Date();
            this.metrics.uptime = 0;

            return { healthy: false, responseTime };
        }
    }

    /**
     * Update average response time
     */
    private updateAverageResponseTime() {
        if (this.responseTimes.length === 0) return;

        const sum = this.responseTimes.reduce((a, b) => a + b, 0);
        this.metrics.averageResponseTime = sum / this.responseTimes.length;
    }

    /**
     * Get current metrics
     */
    getMetrics(): RateLimitMetrics {
        return { ...this.metrics };
    }

    /**
     * Get unresolved incidents
     */
    getActiveIncidents(): RateLimitIncident[] {
        return Array.from(this.incidents.values()).filter(
            (incident) => !incident.resolved
        );
    }

    /**
     * Get incident history
     */
    getIncidentHistory(limit = 50): RateLimitIncident[] {
        return Array.from(this.incidents.values())
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, limit);
    }

    /**
     * Clear old incidents (older than 7 days)
     */
    cleanupOldIncidents() {
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        this.incidents.forEach((incident, id) => {
            if (incident.timestamp < weekAgo) {
                this.incidents.delete(id);
            }
        });
    }

    /**
     * Persist metrics to localStorage
     */
    private persistMetrics() {
        try {
            localStorage.setItem(
                "rate_limit_metrics",
                JSON.stringify(this.metrics)
            );
        } catch (error) {
            console.warn("Failed to persist rate limit metrics:", error);
        }
    }

    /**
     * Load persisted data
     */
    private loadPersistedData() {
        try {
            const stored = localStorage.getItem("rate_limit_metrics");
            if (stored) {
                const parsed = JSON.parse(stored);
                this.metrics = { ...this.metrics, ...parsed };
                this.metrics.lastHealthCheck = new Date(
                    this.metrics.lastHealthCheck
                );
            }
        } catch (error) {
            console.warn("Failed to load persisted rate limit metrics:", error);
        }
    }

    /**
     * Generate health report
     */
    generateHealthReport(): {
        status: "healthy" | "degraded" | "unhealthy";
        summary: string;
        metrics: RateLimitMetrics;
        activeIncidents: number;
        recommendations: string[];
    } {
        const activeIncidents = this.getActiveIncidents();
        const criticalIncidents = activeIncidents.filter(
            (i) => i.severity === "critical"
        );
        const highIncidents = activeIncidents.filter(
            (i) => i.severity === "high"
        );

        let status: "healthy" | "degraded" | "unhealthy" = "healthy";
        let summary = "Rate limiting service is operating normally";
        const recommendations: string[] = [];

        if (criticalIncidents.length > 0) {
            status = "unhealthy";
            summary = `Critical issues detected (${criticalIncidents.length} critical incidents)`;
            recommendations.push("Investigate critical incidents immediately");
            recommendations.push("Consider enabling fallback mode");
        } else if (highIncidents.length > 0 || this.metrics.errorCount > 10) {
            status = "degraded";
            summary = `Service degraded (${highIncidents.length} high severity incidents)`;
            recommendations.push("Monitor service closely");
            recommendations.push("Check Upstash Redis status");
        }

        if (this.metrics.averageResponseTime > 1000) {
            recommendations.push(
                "Response times are high - check network connectivity"
            );
        }

        if (this.metrics.blockedRequests / this.metrics.totalRequests > 0.1) {
            recommendations.push(
                "High rate limit block rate - consider adjusting limits"
            );
        }

        return {
            status,
            summary,
            metrics: this.metrics,
            activeIncidents: activeIncidents.length,
            recommendations,
        };
    }

    /**
     * Cleanup on destroy
     */
    destroy() {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
        }
    }
}

// Export singleton instance
export const rateLimitMonitor = new RateLimitMonitorService();
