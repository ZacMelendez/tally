"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LimitQueryJsonSchema = exports.IdParamJsonSchema = exports.AddValueHistoryJsonSchema = exports.UpdateDebtJsonSchema = exports.CreateDebtJsonSchema = exports.UpdateAssetJsonSchema = exports.CreateAssetJsonSchema = exports.LimitQuerySchema = exports.IdParamSchema = exports.AddValueHistorySchema = exports.UpdateDebtSchema = exports.CreateDebtSchema = exports.UpdateAssetSchema = exports.CreateAssetSchema = exports.DebtCategorySchema = exports.AssetCategorySchema = void 0;
const zod_1 = require("zod");
const zod_to_json_schema_1 = require("zod-to-json-schema");
exports.AssetCategorySchema = zod_1.z.enum([
    "cash",
    "savings",
    "checking",
    "investment",
    "retirement",
    "real-estate",
    "vehicle",
    "personal-property",
    "crypto",
    "other",
]);
exports.DebtCategorySchema = zod_1.z.enum([
    "credit-card",
    "student-loan",
    "mortgage",
    "auto-loan",
    "personal-loan",
    "medical",
    "other",
]);
exports.CreateAssetSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100),
    value: zod_1.z.number().min(0),
    category: exports.AssetCategorySchema,
    description: zod_1.z.string().max(500).optional(),
    url: zod_1.z.string().url().optional().or(zod_1.z.literal("")),
});
exports.UpdateAssetSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100).optional(),
    value: zod_1.z.number().min(0).optional(),
    category: exports.AssetCategorySchema.optional(),
    description: zod_1.z.string().max(500).optional(),
    url: zod_1.z.string().url().optional().or(zod_1.z.literal("")),
});
exports.CreateDebtSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100),
    amount: zod_1.z.number().min(0),
    category: exports.DebtCategorySchema,
    interestRate: zod_1.z.number().min(0).max(100).optional(),
    minimumPayment: zod_1.z.number().min(0).optional(),
    description: zod_1.z.string().max(500).optional(),
    url: zod_1.z.string().url().optional().or(zod_1.z.literal("")),
});
exports.UpdateDebtSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100).optional(),
    amount: zod_1.z.number().min(0).optional(),
    category: exports.DebtCategorySchema.optional(),
    interestRate: zod_1.z.number().min(0).max(100).optional(),
    minimumPayment: zod_1.z.number().min(0).optional(),
    description: zod_1.z.string().max(500).optional(),
    url: zod_1.z.string().url().optional().or(zod_1.z.literal("")),
});
exports.AddValueHistorySchema = zod_1.z.object({
    value: zod_1.z.number().min(0),
    note: zod_1.z.string().max(200).optional(),
});
exports.IdParamSchema = zod_1.z.object({
    id: zod_1.z.string().min(1),
});
exports.LimitQuerySchema = zod_1.z.object({
    limit: zod_1.z.string().regex(/^\d+$/).transform(Number).optional(),
});
exports.CreateAssetJsonSchema = (0, zod_to_json_schema_1.zodToJsonSchema)(exports.CreateAssetSchema);
exports.UpdateAssetJsonSchema = (0, zod_to_json_schema_1.zodToJsonSchema)(exports.UpdateAssetSchema);
exports.CreateDebtJsonSchema = (0, zod_to_json_schema_1.zodToJsonSchema)(exports.CreateDebtSchema);
exports.UpdateDebtJsonSchema = (0, zod_to_json_schema_1.zodToJsonSchema)(exports.UpdateDebtSchema);
exports.AddValueHistoryJsonSchema = (0, zod_to_json_schema_1.zodToJsonSchema)(exports.AddValueHistorySchema);
exports.IdParamJsonSchema = (0, zod_to_json_schema_1.zodToJsonSchema)(exports.IdParamSchema);
exports.LimitQueryJsonSchema = (0, zod_to_json_schema_1.zodToJsonSchema)(exports.LimitQuerySchema);
//# sourceMappingURL=index.js.map