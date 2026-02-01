"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { endOfMonth, startOfMonth } from "date-fns";

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

// --- Main Actions ---

export async function getBudgets(
  month?: number,
  year?: number,
): Promise<Budget[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  // Use provided month/year or default to current
  const now = new Date();
  const targetMonth = month ?? now.getMonth();
  const targetYear = year ?? now.getFullYear();

  // Create a date in the target month for calculating start/end
  const targetDate = new Date(targetYear, targetMonth, 15); // 15th to avoid edge cases
  const start = startOfMonth(targetDate).toISOString();
  const end = endOfMonth(targetDate).toISOString();

  // 1. Parallel Fetching - Budgets and Expenses with equivalents
  const [budgetsRes, expensesRes] = await Promise.all([
    supabase
      .from("budgets")
      .select(
        `
        id, amount, period, category_id, currency,
        category:categories (name, icon, color)
      `,
      )
      .eq("user_id", user.id),
    supabase
      .from("expenses")
      .select("amount, category_id, currency, equivalents")
      .eq("user_id", user.id)
      .gte("date", start)
      .lte("date", end),
  ]);

  if (budgetsRes.error) throw new Error("Failed to fetch budgets");
  if (expensesRes.error)
    console.error("Error fetching expenses:", expensesRes.error);

  const rawBudgets = budgetsRes.data || [];
  const expenses = expensesRes.data || [];

  // 2. Pre-aggregate Expenses by Category using pre-calculated equivalents
  // Data Structure: { [categoryId]: { usd: total, usdt: total, eur: total, ves: total } }
  // Key "all" stores the global total for budgets with no category (General Budgets)
  type EquivalentTotals = {
    usd: number;
    usdt: number;
    eur: number;
    ves: number;
  };
  const spendingMap: Record<string, EquivalentTotals> = {
    all: { usd: 0, usdt: 0, eur: 0, ves: 0 },
  };

  for (const exp of expenses) {
    const catId = exp.category_id || "uncategorized";

    // Initialize category map if missing
    if (!spendingMap[catId]) {
      spendingMap[catId] = { usd: 0, usdt: 0, eur: 0, ves: 0 };
    }

    // Use pre-calculated equivalents if available
    if (exp.equivalents) {
      const eq = exp.equivalents as EquivalentTotals;
      spendingMap[catId].usd += eq.usd || 0;
      spendingMap[catId].usdt += eq.usdt || 0;
      spendingMap[catId].eur += eq.eur || 0;
      spendingMap[catId].ves += eq.ves || 0;

      spendingMap.all.usd += eq.usd || 0;
      spendingMap.all.usdt += eq.usdt || 0;
      spendingMap.all.eur += eq.eur || 0;
      spendingMap.all.ves += eq.ves || 0;
    } else {
      // Fallback: if no equivalents, add to matching currency only
      const curr = (
        exp.currency || "USD"
      ).toLowerCase() as keyof EquivalentTotals;
      if (curr in spendingMap[catId]) {
        spendingMap[catId][curr] += exp.amount;
        spendingMap.all[curr] += exp.amount;
      }
    }
  }

  // 3. Map Budgets & Get spent from pre-calculated equivalents
  const budgets: Budget[] = rawBudgets.map((b) => {
    const budgetCurrency = (
      b.currency || "USD"
    ).toLowerCase() as keyof EquivalentTotals;

    // Determine which bucket of expenses to look at
    // If budget has a category, use that. If not, use 'all'.
    const targetTotals = b.category_id
      ? spendingMap[b.category_id]
      : spendingMap.all;

    // Get the spent amount in the budget's currency from pre-calculated equivalents
    const spent = targetTotals ? targetTotals[budgetCurrency] || 0 : 0;

    // Safety: Max progress visually is usually 100, but logic might need >100 to show overspending.
    // Kept your logic (capped at 100) for consistency, but usually >100 is useful UI data.
    const progress = Math.min((spent / b.amount) * 100, 100);

    return {
      id: b.id,
      amount: b.amount,
      period: b.period,
      category_id: b.category_id,
      category: b.category, // Type assertion might be needed depending on DB types
      currency: b.currency || "USD",
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
