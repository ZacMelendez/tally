import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

export const AssetCategorySchema = z.enum([
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

export const DebtCategorySchema = z.enum([
    "credit-card",
    "student-loan",
    "mortgage",
    "auto-loan",
    "personal-loan",
    "medical",
    "other",
]);

export const CreateAssetSchema = z.object({
    name: z.string().min(1).max(100),
    value: z.number().min(0),
    category: AssetCategorySchema,
    description: z.string().max(500).optional(),
    url: z.string().url().optional().or(z.literal("")),
});

export const UpdateAssetSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    value: z.number().min(0).optional(),
    category: AssetCategorySchema.optional(),
    description: z.string().max(500).optional(),
    url: z.string().url().optional().or(z.literal("")),
});

export const CreateDebtSchema = z.object({
    name: z.string().min(1).max(100),
    amount: z.number().min(0),
    category: DebtCategorySchema,
    interestRate: z.number().min(0).max(100).optional(),
    minimumPayment: z.number().min(0).optional(),
    description: z.string().max(500).optional(),
    url: z.string().url().optional().or(z.literal("")),
});

export const UpdateDebtSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    amount: z.number().min(0).optional(),
    category: DebtCategorySchema.optional(),
    interestRate: z.number().min(0).max(100).optional(),
    minimumPayment: z.number().min(0).optional(),
    description: z.string().max(500).optional(),
    url: z.string().url().optional().or(z.literal("")),
});

export const AddValueHistorySchema = z.object({
    value: z.number().min(0),
    note: z.string().max(200).optional(),
});

export const IdParamSchema = z.object({
    id: z.string().min(1),
});

export const LimitQuerySchema = z.object({
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
});

// Convert Zod schemas to JSON Schema for Fastify
export const CreateAssetJsonSchema = zodToJsonSchema(CreateAssetSchema);
export const UpdateAssetJsonSchema = zodToJsonSchema(UpdateAssetSchema);
export const CreateDebtJsonSchema = zodToJsonSchema(CreateDebtSchema);
export const UpdateDebtJsonSchema = zodToJsonSchema(UpdateDebtSchema);
export const AddValueHistoryJsonSchema = zodToJsonSchema(AddValueHistorySchema);
export const IdParamJsonSchema = zodToJsonSchema(IdParamSchema);
export const LimitQueryJsonSchema = zodToJsonSchema(LimitQuerySchema);
