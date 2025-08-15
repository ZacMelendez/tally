import { logEvent } from "firebase/analytics";
import { analytics } from "../lib/firebase";

// Custom analytics events for your net worth app
export const analyticsService = {
    // User engagement events
    trackLogin: () => {
        logEvent(analytics, "login", {
            method: "google",
        });
    },

    trackLogout: () => {
        logEvent(analytics, "logout");
    },

    // Asset management events
    trackAssetAdded: (assetType: string, value: number) => {
        logEvent(analytics, "asset_added", {
            asset_type: assetType,
            value_range: getValueRange(value),
            currency: "USD",
        });
    },

    trackAssetUpdated: (assetType: string, newValue: number) => {
        logEvent(analytics, "asset_updated", {
            asset_type: assetType,
            value_range: getValueRange(newValue),
            currency: "USD",
        });
    },

    trackAssetDeleted: (assetType: string) => {
        logEvent(analytics, "asset_deleted", {
            asset_type: assetType,
        });
    },

    // Debt management events
    trackDebtAdded: (debtType: string, value: number, interestRate: number) => {
        logEvent(analytics, "debt_added", {
            debt_type: debtType,
            value_range: getValueRange(value),
            interest_rate_range: getInterestRateRange(interestRate),
            currency: "USD",
        });
    },

    trackDebtUpdated: (debtType: string, newValue: number) => {
        logEvent(analytics, "debt_updated", {
            debt_type: debtType,
            value_range: getValueRange(newValue),
            currency: "USD",
        });
    },

    trackDebtDeleted: (debtType: string) => {
        logEvent(analytics, "debt_deleted", {
            debt_type: debtType,
        });
    },

    // Net worth events
    trackNetWorthCalculated: (
        netWorth: number,
        assetCount: number,
        debtCount: number
    ) => {
        logEvent(analytics, "net_worth_calculated", {
            net_worth_range: getValueRange(netWorth),
            asset_count: assetCount,
            debt_count: debtCount,
            currency: "USD",
        });
    },

    trackChartViewed: (timeRange: string) => {
        logEvent(analytics, "chart_viewed", {
            time_range: timeRange,
        });
    },

    // Feature usage events
    trackValueHistoryViewed: (itemType: "asset" | "debt", itemName: string) => {
        logEvent(analytics, "value_history_viewed", {
            item_type: itemType,
            item_category: itemName,
        });
    },

    trackExportData: (format: string) => {
        logEvent(analytics, "data_exported", {
            format: format,
        });
    },

    // Error tracking
    trackError: (errorType: string, errorMessage: string) => {
        logEvent(analytics, "app_error", {
            error_type: errorType,
            error_message: errorMessage.substring(0, 100), // Limit message length
        });
    },

    // Performance events
    trackPageView: (pageName: string) => {
        logEvent(analytics, "page_view", {
            page_title: pageName,
            page_location: window.location.href,
        });
    },
};

// Helper functions to categorize values for privacy
function getValueRange(value: number): string {
    if (value < 1000) return "0-1k";
    if (value < 10000) return "1k-10k";
    if (value < 50000) return "10k-50k";
    if (value < 100000) return "50k-100k";
    if (value < 500000) return "100k-500k";
    if (value < 1000000) return "500k-1m";
    return "1m+";
}

function getInterestRateRange(rate: number): string {
    if (rate < 2) return "0-2%";
    if (rate < 5) return "2-5%";
    if (rate < 10) return "5-10%";
    if (rate < 20) return "10-20%";
    return "20%+";
}
