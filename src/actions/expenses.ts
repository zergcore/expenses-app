"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

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
  year?: number
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
      { count: "exact" }
    )
    .eq("user_id", user.id);

  // Apply date filter if provided, otherwise default to "all time" or keep as is?
  // User asked: "table... should show only the expenses of the current month"
  // So if month/year are missing, we should default to current month?
  // Let's implement strict filtering if provided, OR default to current month if specifically requested by user requirement.
  // The requirement says: "table that is always open at the beginning should show only the expenses of the current month"

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
  year?: number
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
  formData: FormData
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

  revalidatePath("/expenses");
  revalidatePath("/"); // Dashboard summary might change
  return { success: true };
}

export async function updateExpense(
  prevState: ActionState,
  formData: FormData
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

  revalidatePath("/expenses");
  revalidatePath("/");
  return { success: true };
}

export async function deleteExpense(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("expenses").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/expenses");
}
