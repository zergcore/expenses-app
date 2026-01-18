"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { endOfMonth, startOfMonth } from "date-fns";
import { getExchangeRates } from "@/actions/rates";

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

  // 1. Fetch Budgets & Rates in parallel
  const [budgetsRes, rates] = await Promise.all([
    supabase
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
      .eq("user_id", user.id),
    getExchangeRates(),
  ]);

  if (budgetsRes.error) {
    console.error("Error fetching budgets:", budgetsRes.error);
    throw new Error("Failed to fetch budgets");
  }

  // Helper to get rate value
  const getRateValue = (pair: string): number => {
    const r = rates.find((rate) => rate.pair === pair);
    return r ? r.value : 0;
  };

  const usdToVes = getRateValue("USD / VED");
  const usdtToVes = getRateValue("USDT / USD"); // Actually USDT -> VES rate in our modified action
  // Note: "USDT / USD" relies on the `value` field which we set to the VES price in rates.ts
  // Wait, let's verify `rates.ts` logic.
  // In `rates.ts`:
  // pair: "USDT / USD", value: usdtVes (which is Bs per USDT from Binance)
  // pair: "USD / VED", value: usdVes (which is Bs per USD from BCV)

  const convertToBudget = (
    amount: number,
    from: string,
    to: string
  ): number => {
    if (from === to) return amount;

    if (to === "VES" || to === "VED") {
      if (from === "USD") return amount * usdToVes;
      if (from === "USDT") return amount * usdtToVes;
    }

    if (to === "USD") {
      if (from === "VES" || from === "VED")
        return usdToVes > 0 ? amount / usdToVes : 0;
      if (from === "USDT")
        return usdToVes > 0 ? (amount * usdtToVes) / usdToVes : amount;
    }

    if (to === "USDT") {
      if (from === "VES" || from === "VED")
        return usdtToVes > 0 ? amount / usdtToVes : 0;
      if (from === "USD")
        return usdtToVes > 0 ? (amount * usdToVes) / usdtToVes : amount;
    }

    return amount; // Fallback
  };

  // 2. Fetch Expenses for Current Month to calculate execution
  const now = new Date();
  const start = startOfMonth(now).toISOString();
  const end = endOfMonth(now).toISOString();

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
  const rawBudgets = (budgetsRes.data as any[]) || [];

  // 3. Map and Calculate
  const budgets: Budget[] = rawBudgets.map((b) => {
    let spent = 0;
    const budgetCurrency = b.currency || "USD";

    // Filter relevant expenses strictly by category?
    const relevantExpenses = b.category_id
      ? expenses.filter((e) => e.category_id === b.category_id)
      : expenses;

    // Sum converted amounts
    spent = relevantExpenses.reduce((acc, curr) => {
      const converted = convertToBudget(
        curr.amount,
        curr.currency || "USD",
        budgetCurrency
      );
      return acc + converted;
    }, 0);

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
