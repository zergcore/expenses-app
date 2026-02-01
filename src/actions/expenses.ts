"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createNotification } from "./notifications";

// --- Helper Functions ---

async function checkBudgetLimits(userId: string, categoryId: string | null) {
  if (!categoryId) return;

  const supabase = await createClient();
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

  const [budgetRes, expensesRes] = await Promise.all([
    supabase
      .from("budgets")
      .select("amount")
      .eq("user_id", userId)
      .eq("category_id", categoryId)
      .single(),
    supabase
      .from("expenses")
      .select("amount")
      .eq("user_id", userId)
      .eq("category_id", categoryId)
      .gte("date", start)
      .lte("date", end),
  ]);

  const budget = budgetRes.data;
  if (!budget) return;

  const spent = (expensesRes.data || []).reduce(
    (acc, curr) => acc + curr.amount,
    0,
  );
  const percentage = (spent / budget.amount) * 100;

  if (percentage >= 100) {
    await createNotification(
      userId,
      "budget_alert",
      "Budget Exceeded",
      `You have exceeded your budget. Spent: $${spent.toFixed(2)} / $${budget.amount}`,
    );
  } else if (percentage >= 80) {
    await createNotification(
      userId,
      "budget_alert",
      "Approaching Limit",
      `You have used ${Math.round(percentage)}% of your budget.`,
    );
  }
}

// --- Types & Schemas ---

export type Expense = {
  id: string;
  amount: number;
  currency: string;
  description: string | null;
  date: string;
  category: {
    name: string;
    icon: string | null;
    color: string | null;
    is_default: boolean;
  } | null;
  category_id: string | null;
  equivalents: {
    usd: number;
    ves: number;
    usdt: number;
    eur: number;
  } | null;
  rates_at_creation: {
    usd_ves: number;
    usdt_ves: number;
    eur_ves: number;
    usd_usdt: number;
    eur_usdt: number;
  } | null;
};

// Internal type for Supabase response in getExpenses
type RawExpenseResponse = {
  id: string;
  amount: number;
  currency: string;
  description: string | null;
  date: string;
  category_id: string | null;
  category: {
    name: string;
    icon: string | null;
    color: string | null;
    is_default: boolean;
  } | null;
  equivalents: {
    usd: number;
    ves: number;
    usdt: number;
    eur: number;
  } | null;
  rates_at_creation: {
    usd_ves: number;
    usdt_ves: number;
    eur_ves: number;
    usd_usdt: number;
    eur_usdt: number;
  } | null;
};

const expenseSchema = z.object({
  amount: z.coerce.number().positive("Amount must be positive"),
  currency: z.enum(["USD", "VES", "USDT", "EUR"]),
  date: z.string(),
  category_id: z.string().optional().nullable(),
  description: z.string().optional(),
});

export type ActionState = {
  error?: string;
  errors?: Record<string, string[]>;
  success?: boolean;
};

// --- Actions ---

export async function getExpenses(
  page: number = 1,
  limit: number = 10,
  month?: number,
  year?: number,
): Promise<{ data: Expense[]; count: number }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { data: [], count: 0 };

  const offset = (page - 1) * limit;
  const targetYear = year ?? new Date().getFullYear();
  const targetMonth = month ?? new Date().getMonth();
  const start = new Date(targetYear, targetMonth, 1).toISOString();
  const end = new Date(targetYear, targetMonth + 1, 0).toISOString();

  const { data, count, error } = await supabase
    .from("expenses")
    .select(
      `
      id, amount, currency, description, date, category_id, equivalents, rates_at_creation,
      category:categories (name, icon, color, is_default)
    `,
      { count: "exact" },
    )
    .eq("user_id", user.id)
    .gte("date", start)
    .lte("date", end)
    .order("date", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("Error fetching expenses:", error);
    throw new Error("Failed to fetch expenses");
  }

  // Use the internal type to cast safely without 'any'
  const rawData = (data as unknown as RawExpenseResponse[]) || [];

  return { data: rawData, count: count || 0 };
}

export async function getExpenseTotal(
  month?: number,
  year?: number,
): Promise<number> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return 0;

  const targetYear = year ?? new Date().getFullYear();
  const targetMonth = month ?? new Date().getMonth();
  const start = new Date(targetYear, targetMonth, 1).toISOString();
  const end = new Date(targetYear, targetMonth + 1, 0).toISOString();

  const { data, error } = await supabase
    .from("expenses")
    .select("amount")
    .eq("user_id", user.id)
    .gte("date", start)
    .lte("date", end);

  if (error) return 0;

  return (data || []).reduce((acc, curr) => acc + curr.amount, 0);
}

export type CategorySpending = {
  category: {
    name: string;
    icon: string | null;
    color: string | null;
    is_default: boolean;
  } | null;
  amount: number;
  percentage: number;
};

type Category = {
  name: string;
  icon: string | null;
  color: string | null;
  is_default: boolean;
};

export async function getSpendingByCategory(
  month?: number,
  year?: number,
): Promise<CategorySpending[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const targetYear = year ?? new Date().getFullYear();
  const targetMonth = month ?? new Date().getMonth();
  const start = new Date(targetYear, targetMonth, 1).toISOString();
  const end = new Date(targetYear, targetMonth + 1, 0).toISOString();

  const { data, error } = await supabase
    .from("expenses")
    .select(
      `
      amount,
      category:categories (name, icon, color, is_default)
    `,
    )
    .eq("user_id", user.id)
    .gte("date", start)
    .lte("date", end);

  if (error || !data || data.length === 0) return [];

  const grouped = new Map<
    string,
    { category: Category | null; amount: number }
  >();
  let total = 0;

  type RawExpense = {
    amount: number;
    category: Category | null;
  };

  (data as unknown as RawExpense[]).forEach((item) => {
    total += item.amount;
    const key = item.category?.name || "Uncategorized";

    if (!grouped.has(key)) {
      grouped.set(key, { category: item.category, amount: 0 });
    }

    const entry = grouped.get(key)!;
    entry.amount += item.amount;
  });

  if (total === 0) return [];

  return Array.from(grouped.values())
    .map((item) => ({
      category: item.category,
      amount: item.amount,
      percentage: (item.amount / total) * 100,
    }))
    .sort((a, b) => b.amount - a.amount);
}

export async function createExpense(
  prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await createClient();

  const rawData = {
    amount: formData.get("amount"),
    currency: formData.get("currency"),
    date: formData.get("date"),
    category_id:
      formData.get("category_id") === "none"
        ? null
        : formData.get("category_id"),
    description: formData.get("description"),
  };

  const validated = expenseSchema.safeParse(rawData);
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

  // Fetch current rates and calculate equivalents
  const { getCurrentRatesSnapshot } = await import("@/actions/rates");
  const { calculateEquivalents } = await import("@/lib/currency-calculator");

  const rates = await getCurrentRatesSnapshot();
  const amount = validated.data.amount;
  const currency = validated.data.currency as "USD" | "VES" | "USDT" | "EUR";

  const equivalents = calculateEquivalents(amount, currency, rates);

  const { error } = await supabase.from("expenses").insert({
    user_id: user.id,
    ...validated.data,
    equivalents,
    rates_at_creation: rates,
  });

  if (error) return { error: error.message };

  if (validated.data.category_id) {
    await checkBudgetLimits(user.id, validated.data.category_id);
  }

  revalidatePath("/expenses");
  revalidatePath("/");
  revalidatePath("/budgets");
  return { success: true };
}

export async function updateExpense(
  prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await createClient();
  const id = formData.get("id") as string;

  const rawData = {
    amount: formData.get("amount"),
    currency: formData.get("currency"),
    date: formData.get("date"),
    category_id:
      formData.get("category_id") === "none"
        ? null
        : formData.get("category_id"),
    description: formData.get("description"),
  };

  const validated = expenseSchema.safeParse(rawData);
  if (!validated.success) return { error: "Invalid input" };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  // Recalculate equivalents with current rates
  const { getCurrentRatesSnapshot } = await import("@/actions/rates");
  const { calculateEquivalents } = await import("@/lib/currency-calculator");

  const rates = await getCurrentRatesSnapshot();
  const amount = validated.data.amount;
  const currency = validated.data.currency as "USD" | "VES" | "USDT" | "EUR";

  const equivalents = calculateEquivalents(amount, currency, rates);

  const { error } = await supabase
    .from("expenses")
    .update({
      ...validated.data,
      equivalents,
      rates_at_creation: rates,
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  if (validated.data.category_id) {
    await checkBudgetLimits(user.id, validated.data.category_id);
  }

  revalidatePath("/expenses");
  revalidatePath("/");
  revalidatePath("/budgets");
  return { success: true };
}

export async function deleteExpense(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("expenses")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw error;

  revalidatePath("/expenses");
  revalidatePath("/");
  revalidatePath("/budgets");
}

// -- Export function types --
type RawExportExpense = {
  amount: number;
  currency: string;
  description: string | null;
  date: string;
  category_id: string | null;
  category: { name: string } | null;
};

type RawExportBudget = {
  amount: number;
  currency: string;
  category_id: string | null;
  category: { name: string } | null;
};

export async function getAllExpensesForExport(month?: number, year?: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const targetYear = year ?? new Date().getFullYear();
  const targetMonth = month ?? new Date().getMonth();
  const start = new Date(targetYear, targetMonth, 1).toISOString();
  const end = new Date(targetYear, targetMonth + 1, 0).toISOString();

  const [expensesRes, budgetsRes] = await Promise.all([
    supabase
      .from("expenses")
      .select(
        `
        amount, currency, description, date, category_id,
        category:categories (name)
      `,
      )
      .eq("user_id", user.id)
      .gte("date", start)
      .lte("date", end)
      .order("date", { ascending: false }),

    supabase
      .from("budgets")
      .select(
        `
        amount, currency, category_id,
        category:categories (name)
      `,
      )
      .eq("user_id", user.id),
  ]);

  // Cast strictly here using our defined types
  const expenses = (expensesRes.data as unknown as RawExportExpense[]) || [];
  const budgets = (budgetsRes.data as unknown as RawExportBudget[]) || [];

  const budgetMap = new Map(budgets.map((b) => [b.category_id, b]));

  return expenses.map((expense) => {
    const budget = budgetMap.get(expense.category_id);
    return {
      date: expense.date,
      category: expense.category?.name || "Uncategorized",
      description: expense.description || "",
      amount: expense.amount,
      currency: expense.currency || "USD",
      budget_name: budget
        ? budget.category?.name || "Global Budget"
        : "No Budget",
      budget_amount: budget ? budget.amount : "N/A",
      budget_currency: budget ? budget.currency : "",
    };
  });
}
