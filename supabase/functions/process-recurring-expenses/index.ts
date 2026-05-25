// Supabase Edge Function: process-recurring-expenses
// Runs daily to generate expenses from recurring rules
// Includes idempotency protection via recurring_rule_executions table

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

// Types
interface RecurringRule {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  category_id: string | null;
  description: string | null;
  frequency: string;
  next_due_date: string;
}

interface ProcessingResult {
  rule_id: string;
  status: "processed" | "skipped" | "error";
  expense_id?: string;
  error?: string;
}

// Calculate next due date based on frequency
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

// Main handler
Deno.serve(async (_req) => {
  try {
    // Create Supabase client with service role for full access
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split("T")[0];

    // Query recurring rules where next_due_date <= today and is_active = true
    const { data: rules, error: rulesError } = await supabase
      .from("recurring_rules")
      .select("*")
      .lte("next_due_date", today)
      .eq("is_active", true);

    if (rulesError) {
      throw new Error(`Failed to fetch rules: ${rulesError.message}`);
    }

    if (!rules || rules.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "No rules to process",
          processed: 0,
        }),
        { headers: { "Content-Type": "application/json" } },
      );
    }

    const results: ProcessingResult[] = [];

    // Process each rule
    for (const rule of rules as RecurringRule[]) {
      try {
        // Check if already processed for today (idempotency check)
        const { data: existingExecution } = await supabase
          .from("recurring_rule_executions")
          .select("id")
          .eq("rule_id", rule.id)
          .eq("execution_date", rule.next_due_date)
          .single();

        if (existingExecution) {
          // Already processed, skip
          results.push({
            rule_id: rule.id,
            status: "skipped",
          });
          continue;
        }

        // Create the expense
        const { data: expense, error: expenseError } = await supabase
          .from("expenses")
          .insert({
            user_id: rule.user_id,
            amount: rule.amount,
            currency: rule.currency,
            category_id: rule.category_id,
            description: rule.description,
            date: rule.next_due_date,
            is_recurring: true,
          })
          .select("id")
          .single();

        if (expenseError) {
          throw new Error(`Failed to create expense: ${expenseError.message}`);
        }

        // Record the execution for idempotency
        const { error: executionError } = await supabase
          .from("recurring_rule_executions")
          .insert({
            rule_id: rule.id,
            execution_date: rule.next_due_date,
            expense_id: expense.id,
          });

        if (executionError) {
          // Log but continue - the expense was created successfully
          console.error(
            `Failed to record execution: ${executionError.message}`,
          );
        }

        // Update the rule's next_due_date
        const nextDueDate = getNextDueDate(rule.next_due_date, rule.frequency);
        const { error: updateError } = await supabase
          .from("recurring_rules")
          .update({ next_due_date: nextDueDate })
          .eq("id", rule.id);

        if (updateError) {
          console.error(
            `Failed to update next_due_date: ${updateError.message}`,
          );
        }

        results.push({
          rule_id: rule.id,
          status: "processed",
          expense_id: expense.id,
        });
      } catch (error) {
        results.push({
          rule_id: rule.id,
          status: "error",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    const processed = results.filter((r) => r.status === "processed").length;
    const skipped = results.filter((r) => r.status === "skipped").length;
    const errors = results.filter((r) => r.status === "error").length;

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${processed} rules, skipped ${skipped}, errors ${errors}`,
        processed,
        skipped,
        errors,
        results,
      }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
