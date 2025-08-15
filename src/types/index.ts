export interface User {
    id: string;
    email: string;
    displayName: string;
    photoURL?: string;
    createdAt: Date;
}

export interface Asset {
    id: string;
    userId: string;
    name: string;
    value: number;
    category: AssetCategory;
    description?: string;
    url?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface Debt {
    id: string;
    userId: string;
    name: string;
    amount: number;
    category: DebtCategory;
    interestRate?: number;
    minimumPayment?: number;
    description?: string;
    url?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface NetWorthSnapshot {
    id: string;
    userId: string;
    totalAssets: number;
    totalDebts: number;
    netWorth: number;
    createdAt: Date;
}

export type AssetCategory =
    | "cash"
    | "savings"
    | "checking"
    | "investment"
    | "retirement"
    | "real-estate"
    | "vehicle"
    | "personal-property"
    | "crypto"
    | "other";

export type DebtCategory =
    | "credit-card"
    | "student-loan"
    | "mortgage"
    | "auto-loan"
    | "personal-loan"
    | "medical"
    | "other";

// Legacy rate limit state (for fallback)
export interface RateLimitState {
    count: number;
    resetTime: number;
}

// Secure rate limiting types
export interface SecureRateLimitResult {
    success: boolean;
    limit: number;
    remaining: number;
    reset: number;
    retryAfter?: number;
}

export interface RateLimitConfig {
    requests: number;
    window: string; // e.g., "60 s", "5 m", "1 h"
}

export interface AssetValueHistory {
    id: string;
    assetId: string;
    userId: string;
    value: number;
    note?: string;
    createdAt: Date;
}

export interface DebtValueHistory {
    id: string;
    debtId: string;
    userId: string;
    amount: number;
    note?: string;
    createdAt: Date;
}

// API Request/Response types
export interface CreateAssetRequest {
    name: string;
    value: number;
    category: AssetCategory;
    description?: string;
    url?: string;
}

export interface UpdateAssetRequest extends Partial<CreateAssetRequest> {}

export interface CreateDebtRequest {
    name: string;
    amount: number;
    category: DebtCategory;
    interestRate?: number;
    minimumPayment?: number;
    description?: string;
    url?: string;
}

export interface UpdateDebtRequest extends Partial<CreateDebtRequest> {}

export interface AddValueHistoryRequest {
    value: number;
    note?: string;
}

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}
