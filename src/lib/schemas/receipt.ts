import { z } from "zod";

// Schema for line items extracted from a receipt
export const lineItemSchema = z.object({
  description: z.string().describe("Description of the item purchased"),
  quantity: z.number().optional().describe("Quantity of items if available"),
  unitPrice: z.number().optional().describe("Price per unit if available"),
  amount: z.number().describe("Total amount for this line item"),
});

// Schema for the complete receipt extraction result
export const receiptExtractionSchema = z.object({
  merchantName: z.string().describe("Name of the merchant or store"),
  merchantAddress: z
    .string()
    .optional()
    .describe("Address of the merchant if visible"),
  transactionDate: z
    .string()
    .describe("Date of the transaction in ISO format (YYYY-MM-DD)"),
  totalAmount: z.number().describe("Total amount of the receipt"),
  subtotal: z.number().optional().describe("Subtotal before tax if available"),
  taxAmount: z.number().optional().describe("Tax amount if visible on receipt"),
  tipAmount: z.number().optional().describe("Tip amount if applicable"),
  currency: z
    .enum(["USD", "VES", "USDT", "EUR"])
    .default("USD")
    .describe("Currency of the transaction"),
  paymentMethod: z
    .string()
    .optional()
    .describe("Payment method used (cash, card, etc.)"),
  lineItems: z
    .array(lineItemSchema)
    .default([])
    .describe("Individual items on the receipt"),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe("Confidence score of the extraction (0-1)"),
  notes: z
    .string()
    .optional()
    .describe("Any additional relevant information from the receipt"),
});

// Type exports for use in components and actions
export type LineItem = z.infer<typeof lineItemSchema>;
export type ReceiptExtraction = z.infer<typeof receiptExtractionSchema>;

// Schema for the receipt database record
export const receiptRecordSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  image_path: z.string(),
  extracted_data: receiptExtractionSchema.nullable(),
  confidence: z.number().nullable(),
  status: z.enum(["pending", "processing", "processed", "failed"]),
  created_at: z.string(),
  updated_at: z.string(),
});

export type ReceiptRecord = z.infer<typeof receiptRecordSchema>;
