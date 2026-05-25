"use server";
import { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Database } from "@/types/supabase"; // Auto-generated Supabase types

// --- Types ---

export interface RecurringRule {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  category_id: string | null;
  category: {
    name: string;
    icon: string | null;
    color: string | null;
  } | null;
  description: string | null;
  frequency: "daily" | "weekly" | "monthly" | "yearly";
  next_due_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ActionState {
  error?: string;
  errors?: Record<string, string[]>;
  success?: boolean;
}

// --- Validation Schema ---

const recurringRuleSchema = z.object({
  amount: z.coerce.number().positive("Amount must be positive"),
  currency: z.enum(["USD", "VES", "USDT", "EUR"]),
  // Transform empty strings from FormData into null for strict DB compliance
  category_id: z
    .string()
    .optional()
    .transform((val) => (val === "" ? null : val)),
  description: z.string().optional(),
  frequency: z.enum(["daily", "weekly", "monthly", "yearly"]),
  next_due_date: z.string(),
  generate_now: z.boolean().optional(),
});

// --- Helper Functions ---

/**
 * Ensures the user is authenticated. Throws an error to be caught by the action,
 * or returns the valid user session.
 */
async function requireAuth(supabase: SupabaseClient<Database>) {
  // Notice we removed the double await (await supabase) hack here too
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  return user;
}

function getNextDueDate(currentDate: string, frequency: string): string {
  // Use noon to avoid timezone shifts during calculation
  const date = new Date(currentDate + "T12:00:00Z");

  switch (frequency) {
    case "daily":
      date.setUTCDate(date.getUTCDate() + 1);
      break;
    case "weekly":
      date.setUTCDate(date.getUTCDate() + 7);
      break;
    case "monthly": {
      const currentMonth = date.getUTCMonth();
      date.setUTCMonth(currentMonth + 1);
      if (date.getUTCMonth() !== (currentMonth + 1) % 12) {
        date.setUTCDate(0);
      }
      break;
    }
    case "yearly": {
      const currentYear = date.getUTCFullYear();
      date.setUTCFullYear(currentYear + 1);
      if (date.getUTCMonth() === 2 && date.getUTCDate() === 1) {
        date.setUTCDate(0);
      }
      break;
    }
    default:
      date.setUTCMonth(date.getUTCMonth() + 1);
  }

  return date.toISOString().split("T")[0];
}

// --- Actions ---

export async function getRecurringRules(): Promise<RecurringRule[]> {
  const supabase = await createClient<Database>();

  try {
    const user = await requireAuth(supabase);

    const { data, error } = await supabase
      .from("recurring_rules")
      .select(`*, category:categories(name, icon, color)`)
      .eq("user_id", user.id)
      .order("next_due_date", { ascending: true });

    if (error) {
      if (error.code === "42P01") return []; // Handle unapplied migrations silently
      console.error("Error fetching recurring rules:", error);
      return [];
    }

    return data as RecurringRule[];
  } catch {
    return []; // Return empty if not authenticated
  }
}

export async function createRecurringRule(
  prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await createClient<Database>();

  let user;
  try {
    user = await requireAuth(supabase);
  } catch (err) {
    // Check if it's a standard JS Error object
    if (err instanceof Error) {
      return { error: err.message };
    }
    // Fallback for non-standard throws
    return { error: "An unknown authentication error occurred" };
  }

  const rawData = {
    amount: formData.get("amount"),
    currency: formData.get("currency"),
    category_id: formData.get("category_id"),
    description: formData.get("description"),
    frequency: formData.get("frequency"),
    next_due_date: formData.get("next_due_date"),
    generate_now: formData.get("generate_now") === "true",
  };

  const validated = recurringRuleSchema.safeParse(rawData);

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { generate_now, ...ruleData } = validated.data;

  const { data: rule, error: ruleError } = await supabase
    .from("recurring_rules")
    .insert({
      user_id: user.id,
      ...ruleData,
    })
    .select()
    .single();

  if (ruleError || !rule) {
    console.error("Error creating recurring rule:", ruleError);
    return { error: "Failed to create recurring rule" };
  }

  if (generate_now) {
    const { data: expense, error: expenseError } = await supabase
      .from("expenses")
      .insert({
        user_id: user.id,
        amount: ruleData.amount,
        currency: ruleData.currency,
        category_id: ruleData.category_id,
        description: ruleData.description,
        date: ruleData.next_due_date,
        is_recurring: true,
      })
      .select("id")
      .single();

    if (expenseError) {
      console.error("Error creating immediate expense:", expenseError);
    } else if (expense) {
      // Execute subsequent updates concurrently to reduce latency
      const nextDate = getNextDueDate(
        ruleData.next_due_date,
        ruleData.frequency,
      );

      await Promise.all([
        supabase.from("recurring_rule_executions").insert({
          rule_id: rule.id,
          execution_date: ruleData.next_due_date,
          expense_id: expense.id,
        }),
        supabase
          .from("recurring_rules")
          .update({ next_due_date: nextDate })
          .eq("id", rule.id),
      ]);
    }
  }

  revalidatePath("/recurring");
  revalidatePath("/expenses");
  revalidatePath("/");

  return { success: true };
}

export async function updateRecurringRule(
  prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await createClient<Database>();

  let user;
  try {
    user = await requireAuth(supabase);
  } catch (err) {
    // Check if it's a standard JS Error object
    if (err instanceof Error) {
      return { error: err.message };
    }
    // Fallback for non-standard throws
    return { error: "An unknown authentication error occurred" };
  }

  const ruleId = formData.get("id") as string;
  if (!ruleId) return { error: "Rule ID is required" };

  const rawData = {
    amount: formData.get("amount"),
    currency: formData.get("currency"),
    category_id: formData.get("category_id"),
    description: formData.get("description"),
    frequency: formData.get("frequency"),
    next_due_date: formData.get("next_due_date"),
  };

  const validated = recurringRuleSchema
    .omit({ generate_now: true })
    .safeParse(rawData);

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { error } = await supabase
    .from("recurring_rules")
    .update(validated.data)
    .eq("id", ruleId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error updating recurring rule:", error);
    return { error: "Failed to update recurring rule" };
  }

  revalidatePath("/recurring");
  return { success: true };
}

export async function deleteRecurringRule(id: string): Promise<ActionState> {
  const supabase = await createClient<Database>();

  let user;
  try {
    user = await requireAuth(supabase);
  } catch (err) {
    // Check if it's a standard JS Error object
    if (err instanceof Error) {
      return { error: err.message };
    }
    // Fallback for non-standard throws
    return { error: "An unknown authentication error occurred" };
  }

  const { error } = await supabase
    .from("recurring_rules")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error deleting recurring rule:", error);
    return { error: "Failed to delete recurring rule" };
  }

  revalidatePath("/recurring");
  return { success: true };
}

export async function toggleRecurringRule(
  id: string,
  isActive: boolean,
): Promise<ActionState> {
  const supabase = await createClient<Database>();

  let user;
  try {
    user = await requireAuth(supabase);
  } catch (err) {
    // Check if it's a standard JS Error object
    if (err instanceof Error) {
      return { error: err.message };
    }
    // Fallback for non-standard throws
    return { error: "An unknown authentication error occurred" };
  }

  const { error } = await supabase
    .from("recurring_rules")
    .update({ is_active: isActive })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error toggling recurring rule:", error);
    return { error: "Failed to update recurring rule status" };
  }

  revalidatePath("/recurring");
  return { success: true };
}

export async function processRuleNow(ruleId: string): Promise<ActionState> {
  const supabase = await createClient<Database>();

  let user;
  try {
    user = await requireAuth(supabase);
  } catch (err) {
    // Check if it's a standard JS Error object
    if (err instanceof Error) {
      return { error: err.message };
    }
    // Fallback for non-standard throws
    return { error: "An unknown authentication error occurred" };
  }

  const { data: rule, error: ruleError } = await supabase
    .from("recurring_rules")
    .select("*")
    .eq("id", ruleId)
    .eq("user_id", user.id)
    .single();

  if (ruleError || !rule) return { error: "Rule not found" };

  const today = new Date().toISOString().split("T")[0];

  const { data: existingExecution } = await supabase
    .from("recurring_rule_executions")
    .select("id")
    .eq("rule_id", ruleId)
    .eq("execution_date", today)
    .single();

  if (existingExecution) return { error: "Rule already processed for today" };

  const { data: expense, error: expenseError } = await supabase
    .from("expenses")
    .insert({
      user_id: user.id,
      amount: rule.amount,
      currency: rule.currency,
      category_id: rule.category_id,
      description: rule.description,
      date: today,
      is_recurring: true,
    })
    .select("id")
    .single();

  if (expenseError || !expense) {
    console.error("Error creating expense:", expenseError);
    return { error: "Failed to create expense" };
  }

  // Execute subsequent updates concurrently
  const nextDate = getNextDueDate(today, rule.frequency);

  await Promise.all([
    supabase.from("recurring_rule_executions").insert({
      rule_id: ruleId,
      execution_date: today,
      expense_id: expense.id,
    }),
    supabase
      .from("recurring_rules")
      .update({ next_due_date: nextDate })
      .eq("id", ruleId),
  ]);

  revalidatePath("/recurring");
  revalidatePath("/expenses");
  revalidatePath("/");

  return { success: true };
}
