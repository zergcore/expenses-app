"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { endOfMonth, startOfMonth } from "date-fns";
import { getExchangeRates } from "@/actions/rates";

// --- Types ---
export type Budget = {
  id: string;
  amount: number;
  period: string;
  category_id: string | null;
  category: {
    name: string;
    icon: string | null;
    color: string | null;
  } | null;
  currency: string;
  spent: number;
  progress: number;
};

// Simplified schema for reuse
const budgetSchema = z.object({
  amount: z.coerce.number().positive("Amount must be positive"),
  category_id: z.string().optional().nullable(),
  period: z.enum(["monthly"]).default("monthly"),
  currency: z.enum(["USD", "VES", "USDT"]).default("USD"),
});

export type ActionState = {
  error?: string;
  errors?: Record<string, string[]>;
  success?: boolean;
};

// --- Helpers ---

// Moved outside to avoid recreation on every request,
// though passing rates in is necessary.
const convertCurrency = (
  amount: number,
  from: string,
  to: string,
  rates: { usdToVes: number; usdtToVes: number },
): number => {
  if (from === to || amount === 0) return amount;
  const { usdToVes, usdtToVes } = rates;

  // Normalized conversion to VES (Pivot)
  let amountInVes = 0;
  if (from === "VES" || from === "VED") amountInVes = amount;
  else if (from === "USD") amountInVes = amount * usdToVes;
  else if (from === "USDT") amountInVes = amount * usdtToVes;

  // Convert VES to Target
  if (to === "VES" || to === "VED") return amountInVes;
  if (to === "USD") return usdToVes > 0 ? amountInVes / usdToVes : 0;
  if (to === "USDT") return usdtToVes > 0 ? amountInVes / usdtToVes : 0;

  return amount;
};

// --- Main Actions ---

export async function getBudgets(): Promise<Budget[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const now = new Date();
  const start = startOfMonth(now).toISOString();
  const end = endOfMonth(now).toISOString();

  // 1. Optimization: Parallel Fetching
  // We fetch Budgets, Rates, AND Expenses simultaneously.
  const [budgetsRes, rates, expensesRes] = await Promise.all([
    supabase
      .from("budgets")
      .select(
        `
        id, amount, period, category_id, currency,
        category:categories (name, icon, color)
      `,
      )
      .eq("user_id", user.id),
    getExchangeRates(),
    supabase
      .from("expenses")
      .select("amount, category_id, currency")
      .eq("user_id", user.id)
      .gte("date", start)
      .lte("date", end),
  ]);

  if (budgetsRes.error) throw new Error("Failed to fetch budgets");
  if (expensesRes.error)
    console.error("Error fetching expenses:", expensesRes.error);

  const rawBudgets = budgetsRes.data || [];
  const expenses = expensesRes.data || [];

  // 2. Prepare Rates
  const getRate = (pair: string) =>
    rates.find((r) => r.pair === pair)?.value ?? 0;
  const rateMap = {
    usdToVes: getRate("USD / VED"),
    usdtToVes: getRate("USDT / USD"), // Assuming this maps correctly based on your previous logic
  };

  // 3. Optimization: Pre-aggregate Expenses by Category & Currency
  // Data Structure: { [categoryId]: { [currency]: totalAmount } }
  // Key "all" stores the global total for budgets with no category (General Budgets)
  const spendingMap: Record<string, Record<string, number>> = {
    all: {}, // Global accumulator
  };

  for (const exp of expenses) {
    const catId = exp.category_id || "uncategorized";
    const cur = exp.currency || "USD";

    // Initialize maps if missing
    if (!spendingMap[catId]) spendingMap[catId] = {};
    if (!spendingMap.all[cur]) spendingMap.all[cur] = 0;
    if (!spendingMap[catId][cur]) spendingMap[catId][cur] = 0;

    // Add to specific category bucket
    spendingMap[catId][cur] += exp.amount;

    // Add to global bucket (for budgets that track everything)
    spendingMap.all[cur] += exp.amount;
  }

  // 4. Map Budgets & Calculate using Pre-aggregated sums
  const budgets: Budget[] = rawBudgets.map((b) => {
    const budgetCurrency = b.currency || "USD";
    let spent = 0;

    // Determine which bucket of expenses to look at
    // If budget has a category, use that. If not, use 'all'.
    const targetMap = b.category_id
      ? spendingMap[b.category_id]
      : spendingMap.all;

    if (targetMap) {
      // Sum up the pre-calculated totals for each currency found in this bucket
      for (const [currency, amount] of Object.entries(targetMap)) {
        spent += convertCurrency(amount, currency, budgetCurrency, rateMap);
      }
    }

    // Safety: Max progress visually is usually 100, but logic might need >100 to show overspending.
    // Kept your logic (capped at 100) for consistency, but usually >100 is useful UI data.
    const progress = Math.min((spent / b.amount) * 100, 100);

    return {
      id: b.id,
      amount: b.amount,
      period: b.period,
      category_id: b.category_id,
      category: b.category, // Type assertion might be needed depending on DB types
      currency: budgetCurrency,
      spent,
      progress,
    } as unknown as Budget;
  });

  return budgets;
}

export async function createBudget(
  prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await createClient();

  // Handle "all" string from select inputs
  const rawCatId = formData.get("category_id");
  const category_id = rawCatId === "all" ? null : rawCatId;

  const rawData = {
    amount: formData.get("amount"),
    category_id,
    period: "monthly",
    currency: formData.get("currency") || "USD",
  };

  const validated = budgetSchema.safeParse(rawData);

  if (!validated.success) {
    return {
      error: "Invalid input",
      errors: validated.error.flatten().fieldErrors,
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  // Optimization: No need to check for existing budgets if your UX allows multiples,
  // but usually you want to prevent duplicates. (Skipped for brevity as per your original code)

  const { error } = await supabase.from("budgets").insert({
    user_id: user.id,
    amount: validated.data.amount,
    category_id: validated.data.category_id,
    period: validated.data.period,
    currency: validated.data.currency,
    start_date: startOfMonth(new Date()).toISOString(),
  });

  if (error) return { error: error.message };

  revalidatePath("/budgets");
  return { success: true };
}

export async function deleteBudget(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("budgets").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/budgets");
}
