import { z } from "zod";

export const cartLineSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive(),
});

export const quoteRequestSchema = z.object({
  cartLines: z.array(cartLineSchema).readonly(),
  couponCode: z.string().trim().min(1).nullable().optional(),
});

export const checkoutRequestSchema = quoteRequestSchema;

export const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  unitPriceCents: z.number().int().nonnegative(),
  stock: z.number().int().nonnegative(),
});

export const quoteDiscountLineSchema = z.object({
  ruleId: z.string(),
  label: z.string(),
  amountCents: z.number().int(),
});

export const quoteLineResultSchema = z.object({
  productId: z.string(),
  quantity: z.number().int(),
  unitPriceCents: z.number().int(),
  originalSubtotalCents: z.number().int(),
  finalAmountCents: z.number().int(),
});

export const quoteResultSchema = z.object({
  originalSubtotalCents: z.number().int(),
  finalTotalCents: z.number().int(),
  totalDiscountCents: z.number().int(),
  effectiveDiscountRate: z.number(),
  capApplied: z.boolean(),
  discounts: z.array(quoteDiscountLineSchema).readonly(),
  lines: z.array(quoteLineResultSchema).readonly(),
});

export const orderResponseSchema = z.object({
  id: z.string(),
  idempotencyKey: z.string(),
  createdAt: z.string(),
  cartLines: z.array(cartLineSchema).readonly(),
  couponCode: z.string().nullable(),
  quote: quoteResultSchema,
});

export const problemDetailSchema = z.object({
  type: z.string(),
  title: z.string(),
  status: z.number().int(),
  detail: z.string(),
  instance: z.string().optional(),
});

export type CartLineDto = z.infer<typeof cartLineSchema>;
export type QuoteRequestDto = z.infer<typeof quoteRequestSchema>;
export type CheckoutRequestDto = z.infer<typeof checkoutRequestSchema>;
export type ProductDto = z.infer<typeof productSchema>;
export type QuoteResultDto = z.infer<typeof quoteResultSchema>;
export type OrderResponseDto = z.infer<typeof orderResponseSchema>;
export type ProblemDetailDto = z.infer<typeof problemDetailSchema>;
