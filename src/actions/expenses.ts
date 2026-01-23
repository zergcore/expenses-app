"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createNotification } from "./notifications";

// Helper to check budget limits
async function checkBudgetLimits(userId: string, categoryId: string | null) {
  if (!categoryId) return; // General budget not implemented yet for specific check? Or check global?
  // Let's check specific category budget first.

  const supabase = await createClient();

  // Get budget for this category
  const { data: budget } = await supabase
    .from("budgets")
    .select("*")
    .eq("user_id", userId)
    .eq("category_id", categoryId)
    .single();

  if (!budget) return;

  // Calculate total spent for this category (current month) (re-using logic or simple query?)
  // We need to query expenses again to be sure of current total.
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

  const { data: expenses } = await supabase
    .from("expenses")
    .select("amount")
    .eq("user_id", userId)
    .eq("category_id", categoryId)
    .gte("date", start)
    .lte("date", end);

  const spent = (expenses || []).reduce((acc, curr) => acc + curr.amount, 0);
  const percentage = (spent / budget.amount) * 100;

  if (percentage >= 100) {
    await createNotification(
      userId,
      "budget_alert",
      "Budget Exceeded",
      `You have exceeded your budget for this category. Spent: $${spent.toFixed(
        2,
      )} / $${budget.amount}`,
    );
  } else if (percentage >= 80) {
    await createNotification(
      userId,
      "budget_alert",
      "Approaching Limit",
      `You have used ${Math.round(
        percentage,
      )}% of your budget for this category.`,
    );
  }
}

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
  } | null;
  category_id: string | null;
};

// Internal interface for the raw Supabase response to fix "implicit any"
interface RawExpenseResponse {
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
  } | null;
}

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

  let query = supabase
    .from("expenses")
    .select(
      `
      id,
      amount,
      currency,
      description,
      date,
      category_id,
      category:categories (
        name,
        icon,
        color
      )
    `,
      { count: "exact" },
    )
    .eq("user_id", user.id);

  const targetYear = year ?? new Date().getFullYear();
  const targetMonth = month ?? new Date().getMonth(); // 0-indexed

  // Calculate start/end of the target month
  const start = new Date(targetYear, targetMonth, 1).toISOString();
  const end = new Date(targetYear, targetMonth + 1, 0).toISOString();

  query = query.gte("date", start).lte("date", end);

  const { data, count, error } = await query
    .order("date", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("Error fetching expenses:", error);
    throw new Error("Failed to fetch expenses");
  }

  // Cast the data to our raw type first to avoid any
  const rawData = (data as unknown as RawExpenseResponse[]) || [];

  const expenses: Expense[] = rawData.map((item) => ({
    id: item.id,
    amount: item.amount,
    currency: item.currency,
    description: item.description,
    date: item.date,
    category_id: item.category_id,
    category: item.category
      ? {
          name: item.category.name,
          icon: item.category.icon,
          color: item.category.color,
        }
      : null,
  }));

  return { data: expenses, count: count || 0 };
}

// Renamed to generic getExpenseTotal but kept old export name for now or refactor all usage?
// Let's keep it clean: getExpenseTotal
export async function getExpenseTotal(
  month?: number,
  year?: number,
): Promise<number> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return 0;

  const now = new Date();
  const targetYear = year ?? now.getFullYear();
  const targetMonth = month ?? now.getMonth();

  const start = new Date(targetYear, targetMonth, 1).toISOString();
  const end = new Date(targetYear, targetMonth + 1, 0).toISOString();

  const { data, error } = await supabase
    .from("expenses")
    .select("amount, currency")
    .eq("user_id", user.id)
    .gte("date", start)
    .lte("date", end);

  if (error) {
    console.error("Error calculating total:", error);
    return 0;
  }

  // Calculate total (assuming USD for simplicity or 1:1 for now, as currency conversion is complex)
  const total = (data || []).reduce((acc, curr) => acc + curr.amount, 0);

  return total;
}

export type CategorySpending = {
  category: {
    name: string;
    icon: string | null;
    color: string | null;
  } | null;
  amount: number;
  percentage: number;
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

  const now = new Date();
  const targetYear = year ?? now.getFullYear();
  const targetMonth = month ?? now.getMonth();

  const start = new Date(targetYear, targetMonth, 1).toISOString();
  const end = new Date(targetYear, targetMonth + 1, 0).toISOString();

  // Fetch all expenses for the period with category details
  const { data, error } = await supabase
    .from("expenses")
    .select(
      `
      amount,
      category:categories (
        name,
        icon,
        color
      )
    `,
    )
    .eq("user_id", user.id)
    .gte("date", start)
    .lte("date", end);

  if (error) {
    console.error("Error fetching spending by category:", error);
    return [];
  }

  // Type the raw response explicitly to rely on single object relation
  type RawSpending = {
    amount: number;
    category: {
      name: string;
      icon: string | null;
      color: string | null;
    } | null;
  };

  const expenses = (data as unknown as RawSpending[]) || [];
  const total = expenses.reduce((acc, curr) => acc + curr.amount, 0);

  if (total === 0) return [];

  // Group by category name (or ID if we had it easily available in this shape, but name is fine for display)
  // Actually, we should group by category object contents.
  type GroupedCategory = {
    category: {
      name: string;
      icon: string | null;
      color: string | null;
    } | null;
    amount: number;
  };

  const grouped = expenses.reduce<Record<string, GroupedCategory>>(
    (acc, curr) => {
      const key = curr.category?.name || "Uncategorized";
      if (!acc[key]) {
        acc[key] = {
          category: curr.category,
          amount: 0,
        };
      }
      acc[key].amount += curr.amount;
      return acc;
    },
    {},
  );

  // Convert to array and calculate percentage
  return Object.values(grouped)
    .map((item) => ({
      category: item.category,
      amount: item.amount,
      percentage: (item.amount / total) * 100,
    }))
    .sort((a, b) => b.amount - a.amount);
}

const expenseSchema = z.object({
  amount: z.coerce.number().positive("Amount must be positive"),
  currency: z.enum(["USD", "VES", "USDT"]),
  date: z.string(),
  category_id: z.string().optional().nullable(),
  description: z.string().optional(),
});

export type ActionState = {
  error?: string;
  errors?: Record<string, string[]>;
  success?: boolean;
};

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

  if (!user) {
    return { error: "Unauthorized" };
  }

  const { error } = await supabase.from("expenses").insert({
    user_id: user.id,
    amount: validated.data.amount,
    currency: validated.data.currency,
    date: validated.data.date,
    category_id: validated.data.category_id,
    description: validated.data.description,
  });

  if (error) {
    return { error: error.message };
  }

  // Check budget limits asynchronously (fire and forget pattern or await?)
  // Await to ensure it runs, but don't block UI strictly if it fails?
  // Server actions must return, so await is safer.
  if (validated.data.category_id) {
    await checkBudgetLimits(user.id, validated.data.category_id);
  }

  revalidatePath("/expenses");
  revalidatePath("/"); // Dashboard summary might change
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

  const { error } = await supabase
    .from("expenses")
    .update({
      amount: validated.data.amount,
      currency: validated.data.currency,
      date: validated.data.date,
      category_id: validated.data.category_id,
      description: validated.data.description,
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

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

  if (!user) {
    throw new Error("Unauthorized");
  }

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

export async function getAllExpensesForExport(
  month?: number,
  year?: number,
): Promise<
  {
    date: string;
    category: string;
    description: string;
    amount: number;
    currency: string;
    budget_name: string;
    budget_amount: number | string;
    budget_currency: string;
  }[]
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  // Re-use fetching logic somewhat or just fetch fresh
  const targetYear = year ?? new Date().getFullYear();
  const targetMonth = month ?? new Date().getMonth();

  const start = new Date(targetYear, targetMonth, 1).toISOString();
  const end = new Date(targetYear, targetMonth + 1, 0).toISOString();

  // 1. Fetch Expenses
  const { data: expensesData, error } = await supabase
    .from("expenses")
    .select(
      `
      amount,
      currency,
      description,
      date,
      category_id,
      category:categories (
        name,
        icon,
        color
      )
    `,
    )
    .eq("user_id", user.id)
    .gte("date", start)
    .lte("date", end)
    .order("date", { ascending: false });

  if (error) {
    console.error("Error fetching expenses for export:", error);
    return [];
  }

  // 2. Fetch Budgets with Category Name
  const { data: budgetsData } = await supabase
    .from("budgets")
    .select(
      `
      amount, 
      currency, 
      category_id,
      category:categories (
        name
      )
    `,
    )
    .eq("user_id", user.id);

  // Type assertion
  type RawBudget = {
    amount: number;
    currency: string;
    category_id: string | null;
    category: { name: string } | null;
  };
  const budgets = (budgetsData as unknown as RawBudget[]) || [];

  // Helper to find budget
  const findBudget = (categoryId: string | null) => {
    return budgets.find((b) => b.category_id === categoryId);
  };

  // 3. Map to flat structure
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (expensesData as any[]).map((expense) => {
    const budget = findBudget(expense.category_id);
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
