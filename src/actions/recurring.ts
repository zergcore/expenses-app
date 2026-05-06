"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

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
  category_id: z.string().optional().nullable(),
  description: z.string().optional(),
  frequency: z.enum(["daily", "weekly", "monthly", "yearly"]),
  next_due_date: z.string(),
  generate_now: z.boolean().optional(),
});

// --- Helper Functions ---

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
      // Handle month-end rollover (e.g. Jan 31 -> Feb 28)
      if (date.getUTCMonth() !== (currentMonth + 1) % 12) {
        date.setUTCDate(0);
      }
      break;
    }
    case "yearly": {
      const currentYear = date.getUTCFullYear();
      date.setUTCFullYear(currentYear + 1);
      // Handle leap year (Feb 29 -> Feb 28)
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
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from("recurring_rules")
    .select(
      `
      *,
      category:categories(name, icon, color)
    `,
    )
    .eq("user_id", user.id)
    .order("next_due_date", { ascending: true });

  if (error) {
    // Silently return empty if table doesn't exist (migration not applied)
    if (error.code === "42P01") {
      return [];
    }
    console.error("Error fetching recurring rules:", error);
    return [];
  }

  return data as RecurringRule[];
}

export async function createRecurringRule(
  prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Parse and validate form data
  const rawData = {
    amount: formData.get("amount"),
    currency: formData.get("currency"),
    category_id: formData.get("category_id") || null,
    description: formData.get("description") || null,
    frequency: formData.get("frequency"),
    next_due_date: formData.get("next_due_date"),
    generate_now: formData.get("generate_now") === "true",
  };

  const validated = recurringRuleSchema.safeParse(rawData);

  if (!validated.success) {
    return {
      errors: validated.error.flatten().fieldErrors,
    };
  }

  const { generate_now, ...ruleData } = validated.data;

  // Create the recurring rule
  const { data: rule, error: ruleError } = await supabase
    .from("recurring_rules")
    .insert({
      user_id: user.id,
      ...ruleData,
      category_id: ruleData.category_id || null,
    })
    .select()
    .single();

  if (ruleError) {
    console.error("Error creating recurring rule:", ruleError);
    return { error: "Failed to create recurring rule" };
  }

  // If "generate now" is checked, create the first expense immediately
  if (generate_now) {
    const { data: expense, error: expenseError } = await supabase
      .from("expenses")
      .insert({
        user_id: user.id,
        amount: ruleData.amount,
        currency: ruleData.currency,
        category_id: ruleData.category_id || null,
        description: ruleData.description,
        date: ruleData.next_due_date,
        is_recurring: true,
      })
      .select("id")
      .single();

    if (expenseError) {
      console.error("Error creating immediate expense:", expenseError);
      // Don't fail the whole operation, just log
    } else {
      // Record the execution for idempotency
      await supabase.from("recurring_rule_executions").insert({
        rule_id: rule.id,
        execution_date: ruleData.next_due_date,
        expense_id: expense.id,
      });

      // Update the rule's next_due_date to the next cycle
      const nextDate = getNextDueDate(
        ruleData.next_due_date,
        ruleData.frequency,
      );
      await supabase
        .from("recurring_rules")
        .update({ next_due_date: nextDate })
        .eq("id", rule.id);
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
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const ruleId = formData.get("id") as string;

  if (!ruleId) {
    return { error: "Rule ID is required" };
  }

  // Parse and validate form data
  const rawData = {
    amount: formData.get("amount"),
    currency: formData.get("currency"),
    category_id: formData.get("category_id") || null,
    description: formData.get("description") || null,
    frequency: formData.get("frequency"),
    next_due_date: formData.get("next_due_date"),
  };

  const validated = recurringRuleSchema
    .omit({ generate_now: true })
    .safeParse(rawData);

  if (!validated.success) {
    return {
      errors: validated.error.flatten().fieldErrors,
    };
  }

  const { error } = await supabase
    .from("recurring_rules")
    .update({
      ...validated.data,
      category_id: validated.data.category_id || null,
    })
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
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
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
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
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
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Fetch the rule
  const { data: rule, error: ruleError } = await supabase
    .from("recurring_rules")
    .select("*")
    .eq("id", ruleId)
    .eq("user_id", user.id)
    .single();

  if (ruleError || !rule) {
    return { error: "Rule not found" };
  }

  const today = new Date().toISOString().split("T")[0];

  // Check if already processed today
  const { data: existingExecution } = await supabase
    .from("recurring_rule_executions")
    .select("id")
    .eq("rule_id", ruleId)
    .eq("execution_date", today)
    .single();

  if (existingExecution) {
    return { error: "Rule already processed for today" };
  }

  // Create the expense
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

  if (expenseError) {
    console.error("Error creating expense:", expenseError);
    return { error: "Failed to create expense" };
  }

  // Record execution
  await supabase.from("recurring_rule_executions").insert({
    rule_id: ruleId,
    execution_date: today,
    expense_id: expense.id,
  });

  // Update next_due_date
  const nextDate = getNextDueDate(today, rule.frequency);
  await supabase
    .from("recurring_rules")
    .update({ next_due_date: nextDate })
    .eq("id", ruleId);

  revalidatePath("/recurring");
  revalidatePath("/expenses");
  revalidatePath("/");

  return { success: true };
}
