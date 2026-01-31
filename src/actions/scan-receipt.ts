"use server";

import { createClient } from "@/lib/supabase/server";
import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { revalidatePath } from "next/cache";
import {
  receiptExtractionSchema,
  type ReceiptExtraction,
} from "@/lib/schemas/receipt";

// --- Types ---

export type ScanReceiptResult = {
  success: boolean;
  receiptId?: string;
  extractedData?: ReceiptExtraction;
  error?: string;
};

export type CreateReceiptFromScanResult = {
  success: boolean;
  expenseId?: string;
  error?: string;
};

// --- Helper: Build VLM Prompt ---

function buildExtractionPrompt(): string {
  return `You are an expert receipt parser. Analyze this receipt image and extract the following information:

1. **Merchant Information**: Store/restaurant name and address if visible
2. **Transaction Details**: Date of purchase (format as YYYY-MM-DD)
3. **Financial Data**: 
   - Subtotal (before tax)
   - Tax amount
   - Tip amount (if applicable)
   - Total amount
4. **Line Items**: Individual items with descriptions and prices
5. **Payment Method**: If visible (cash, card type, etc.)

Important guidelines:
- If the receipt is crumpled, blurry, or partially obscured, extract what you can and indicate lower confidence
- Infer the currency from context ($ = USD, Bs. = VES, etc.)
- For dates, use the format YYYY-MM-DD
- If you cannot determine a field, omit it rather than guessing
- Set confidence between 0 and 1 based on image quality and extraction certainty`;
}

// --- Actions ---

/**
 * Scans a receipt image using Gemini VLM and extracts structured data.
 * Creates a receipt record in the database with the extracted information.
 */
export async function scanReceipt(
  imagePath: string,
): Promise<ScanReceiptResult> {
  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // Create receipt record with pending status
    const { data: receipt, error: insertError } = await supabase
      .from("receipts")
      .insert({
        user_id: user.id,
        image_path: imagePath,
        status: "processing",
      })
      .select("id")
      .single();

    if (insertError || !receipt) {
      console.error("Failed to create receipt record:", insertError);
      return { success: false, error: "Failed to create receipt record" };
    }

    // Get a signed URL for the image (works with private buckets)
    const { data: signedUrlData, error: urlError } = await supabase.storage
      .from("receipts")
      .createSignedUrl(imagePath, 60 * 5); // 5 minute expiry

    if (urlError || !signedUrlData?.signedUrl) {
      console.error("Failed to create signed URL:", urlError);
      await supabase
        .from("receipts")
        .update({ status: "failed" })
        .eq("id", receipt.id);
      return { success: false, error: "Failed to get image URL" };
    }

    // Call Gemini VLM to extract receipt data
    const { object: extractedData } = await generateObject({
      model: google("gemini-2.5-flash"),
      schema: receiptExtractionSchema,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: buildExtractionPrompt() },
            { type: "image", image: signedUrlData.signedUrl },
          ],
        },
      ],
    });

    console.log("Extracted data:", extractedData);

    // Update receipt with extracted data
    const { error: updateError } = await supabase
      .from("receipts")
      .update({
        extracted_data: extractedData,
        confidence: extractedData.confidence,
        status: "processed",
      })
      .eq("id", receipt.id);

    if (updateError) {
      console.error("Failed to update receipt:", updateError);
      return { success: false, error: "Failed to save extraction results" };
    }

    return {
      success: true,
      receiptId: receipt.id,
      extractedData,
    };
  } catch (error) {
    console.error("Receipt scanning failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to scan receipt",
    };
  }
}

/**
 * Creates an expense from a scanned receipt.
 * Links the expense to the receipt record.
 */
export async function createExpenseFromReceipt(
  receiptId: string,
  overrides?: {
    amount?: number;
    currency?: string;
    category_id?: string;
    description?: string;
    date?: string;
  },
): Promise<CreateReceiptFromScanResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  // Fetch the receipt with extracted data
  const { data: receipt, error: fetchError } = await supabase
    .from("receipts")
    .select("*")
    .eq("id", receiptId)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !receipt) {
    return { success: false, error: "Receipt not found" };
  }

  if (receipt.status !== "processed" || !receipt.extracted_data) {
    return { success: false, error: "Receipt has not been processed" };
  }

  const extracted = receipt.extracted_data as ReceiptExtraction;

  // Create expense from extracted data with optional overrides
  const { data: expense, error: insertError } = await supabase
    .from("expenses")
    .insert({
      user_id: user.id,
      receipt_id: receiptId,
      amount: overrides?.amount ?? extracted.totalAmount,
      currency: overrides?.currency ?? extracted.currency,
      description: overrides?.description ?? extracted.merchantName,
      date: overrides?.date ?? extracted.transactionDate,
      category_id: overrides?.category_id ?? null,
    })
    .select("id")
    .single();

  if (insertError || !expense) {
    console.error("Failed to create expense:", insertError);
    return { success: false, error: "Failed to create expense" };
  }

  revalidatePath("/expenses");
  revalidatePath("/");
  revalidatePath("/budgets");

  return { success: true, expenseId: expense.id };
}

/**
 * Gets a receipt by ID for the current user.
 */
export async function getReceipt(receiptId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from("receipts")
    .select("*")
    .eq("id", receiptId)
    .eq("user_id", user.id)
    .single();

  if (error) {
    console.error("Failed to fetch receipt:", error);
    return null;
  }

  return data;
}

/**
 * Gets all receipts for the current user.
 */
export async function getReceipts(limit: number = 20) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from("receipts")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Failed to fetch receipts:", error);
    return [];
  }

  return data;
}

/**
 * Deletes a receipt and its associated image from storage.
 */
export async function deleteReceipt(receiptId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  // Fetch receipt to get image path
  const { data: receipt } = await supabase
    .from("receipts")
    .select("image_path")
    .eq("id", receiptId)
    .eq("user_id", user.id)
    .single();

  if (!receipt) {
    throw new Error("Receipt not found");
  }

  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from("receipts")
    .remove([receipt.image_path]);

  if (storageError) {
    console.error("Failed to delete receipt image:", storageError);
  }

  // Delete from database
  const { error: deleteError } = await supabase
    .from("receipts")
    .delete()
    .eq("id", receiptId)
    .eq("user_id", user.id);

  if (deleteError) {
    throw deleteError;
  }

  revalidatePath("/expenses");
}
