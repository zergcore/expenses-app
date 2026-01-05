"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { endOfMonth, startOfMonth } from "date-fns";

export type Budget = {
  id: string;
  amount: number;
  period: string; // 'monthly'
  category_id: string | null;
  category: {
    name: string;
    icon: string | null;
    color: string | null;
  } | null;
  currency: string; // 'USD', 'VES', 'USDT'
  spent: number; // Calculated field
  progress: number; // Calculated %
};

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

export async function getBudgets(): Promise<Budget[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  // 1. Fetch Budgets
  const { data: budgetsData, error: budgetsError } = await supabase
    .from("budgets")
    .select(
      `
      id,
      amount,
      period,
      category_id,
      currency,
      category:categories (
        name,
        icon,
        color
      )
    `
    )
    .eq("user_id", user.id);

  if (budgetsError) {
    console.error("Error fetching budgets:", budgetsError);
    throw new Error("Failed to fetch budgets");
  }

  // 2. Fetch Expenses for Current Month to calculate execution
  const now = new Date();
  const start = startOfMonth(now).toISOString();
  const end = endOfMonth(now).toISOString();

  // We need to know "spent" per category.
  const { data: expensesData, error: expensesError } = await supabase
    .from("expenses")
    .select("amount, category_id, currency")
    .eq("user_id", user.id)
    .gte("date", start)
    .lte("date", end);

  if (expensesError) {
    console.error("Error fetching budget expenses:", expensesError);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const expenses = (expensesData as any[]) || [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawBudgets = (budgetsData as any[]) || [];

  // 3. Map and Calculate
  const budgets: Budget[] = rawBudgets.map((b) => {
    let spent = 0;

    // Filter expenses matching this budget's category (or all if global)
    // AND matching this budget's currency (or converting? For now, exact match).
    // If budget is USD, only sum USD expenses? Or convert VES to USD?
    // Given the complexity of rates, let's start with EXACT CURRENCY MATCH.
    // If user sets a USD budget, only USD expenses count against it.

    // Note: The schema for budgets didn't explicitly have 'currency' in `getBudgets` select above?
    // Wait, I need to fetch `currency` from budgets table too.
    // I will add it to the select.
    const budgetCurrency = b.currency || "USD"; // Default to USD if missing

    if (b.category_id) {
      spent = expenses
        .filter((e) => e.category_id === b.category_id) // Match Category
        // .filter((e) => e.currency === budgetCurrency) // Match Currency?
        // Actually, many users want to see TOTAL value in a base currency.
        // But the previous request was specific about "Budget Form should include Currency".
        // This implies budgets are currency-specific.
        // So I should sum only expenses of that currency.
        // Or assume everything is converted to USD?
        // Let's sum raw amounts of matching currency.
        .filter((e) => e.currency === budgetCurrency)
        .reduce((acc, curr) => acc + curr.amount, 0);
    } else {
      // Global budget (All categories)
      spent = expenses
        .filter((e) => e.currency === budgetCurrency)
        .reduce((acc, curr) => acc + curr.amount, 0);
    }

    const progress = Math.min((spent / b.amount) * 100, 100);

    return {
      id: b.id,
      amount: b.amount,
      period: b.period,
      category_id: b.category_id,
      category: b.category,
      spent,
      progress,
      currency: budgetCurrency,
    };
  });

  return budgets;
}

export async function createBudget(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient();

  const rawData = {
    amount: formData.get("amount"),
    category_id:
      formData.get("category_id") === "all"
        ? null
        : formData.get("category_id"),
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

  if (!user) {
    return { error: "Unauthorized" };
  }

  const { error } = await supabase.from("budgets").insert({
    user_id: user.id,
    amount: validated.data.amount,
    category_id: validated.data.category_id,
    period: validated.data.period,
    currency: validated.data.currency,
    start_date: startOfMonth(new Date()).toISOString(),
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/budgets");
  return { success: true };
}

export async function deleteBudget(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("budgets").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/budgets");
}
