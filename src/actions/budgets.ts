"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { startOfMonth, endOfMonth } from "date-fns";

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
  spent: number; // Calculated field
  progress: number; // Calculated %
};

// Internal types for Supabase responses
interface RawBudget {
  id: string;
  amount: number;
  period: string;
  category_id: string | null;
  category: {
    name: string;
    icon: string | null;
    color: string | null;
  } | null;
}

interface RawExpense {
  amount: number;
  category_id: string | null;
  currency: string;
}

const budgetSchema = z.object({
  amount: z.coerce.number().positive("Amount must be positive"),
  category_id: z.string().optional().nullable(),
  period: z.enum(["monthly"]).default("monthly"),
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
  // Note: For a robust system, we might want to do this aggregation on the DB side (migration)
  // or use a more specific query. For MVP with moderate data, this JS processing is okay.

  const now = new Date();
  const start = startOfMonth(now).toISOString();
  const end = endOfMonth(now).toISOString();

  // We need to know "spent" per category.
  // Let's fetch all expenses for this user for this month.
  // Optimization: only fetch amount and category_id
  const { data: expensesData, error: expensesError } = await supabase
    .from("expenses")
    .select("amount, category_id, currency") // Currency conversion needed? Assuming USD for now or single currency.
    .eq("user_id", user.id)
    .gte("date", start)
    .lte("date", end);

  if (expensesError) {
    console.error("Error fetching budget expenses:", expensesError);
    // don't fail, just show 0 spent
  }

  const expenses: RawExpense[] = (expensesData as RawExpense[]) || [];
  const rawBudgets: RawBudget[] = (budgetsData as unknown as RawBudget[]) || [];

  // 3. Map and Calculate
  const budgets: Budget[] = rawBudgets.map((b) => {
    // Calculate spent for this budget's category.
    // Logic: Sum expenses where expense.category_id === budget.category_id
    // TODO: Handle subcategories? If I set a budget for "Food", should "Food > Groceries" count?
    // For MVP Phase 1: Direct match only.
    // Ideally we traverses the category tree, but let's start simple.

    // Also, Handle "Global" budget (category_id is null) -> All expenses?
    let spent = 0;

    if (b.category_id) {
      spent = expenses
        .filter((e) => e.category_id === b.category_id)
        .reduce((acc, curr) => acc + curr.amount, 0);
    } else {
      // Global budget (if applicable)
      spent = expenses.reduce((acc, curr) => acc + curr.amount, 0);
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

  // Check if budget already exists for this category?
  // User might want multiple? Let's assume one per category for now to prevent duplicates.
  // This logic is better enforced on DB or checking here.

  const { error } = await supabase.from("budgets").insert({
    user_id: user.id,
    amount: validated.data.amount,
    category_id: validated.data.category_id,
    period: validated.data.period,
    start_date: startOfMonth(new Date()).toISOString(), // Optional in schema?
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
