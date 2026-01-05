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
  userId: string,
  page: number = 1,
  limit: number = 10
): Promise<{ data: Expense[]; count: number }> {
  const supabase = await createClient();
  const offset = (page - 1) * limit;

  // Fetch expenses with category details
  const { data, count, error } = await supabase
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
    .eq("user_id", userId)
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

export async function deleteExpense(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("expenses").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/expenses");
}
