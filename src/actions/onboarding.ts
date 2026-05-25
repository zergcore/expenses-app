"use server";

import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/server";
import {
  onboardingAnswersSchema,
  onboardingSuggestionsSchema,
  type OnboardingAnswers,
  type OnboardingSuggestions,
} from "@/types/onboarding";
import { revalidatePath } from "next/cache";

// Temporary mock or placeholder since SDK might not be configured, or will fallback safely
export async function generateOnboardingSuggestions(
  answers: OnboardingAnswers,
): Promise<
  | { success: true; suggestions: OnboardingSuggestions }
  | { success: false; error: string }
> {
  try {
    await requireUser();
    const parsed = onboardingAnswersSchema.safeParse(answers);
    if (!parsed.success) {
      return { success: false, error: "Invalid answers" };
    }

    const {
      primaryCurrency,
      topCategories,
      savingsGoal,
      customSavingsPercent,
      budgetStyle,
    } = parsed.data;

    // Estimate budget scaling based on income brackets
    let baseAmount = 1000;
    if (answers.incomeRange === "under_500") baseAmount = 350;
    else if (answers.incomeRange === "500_1000") baseAmount = 750;
    else if (answers.incomeRange === "1000_3000") baseAmount = 2000;
    else if (answers.incomeRange === "3000_5000") baseAmount = 4000;
    else baseAmount = 6000;

    // Calculate savings rate
    const savingsRate =
      savingsGoal === "custom"
        ? (customSavingsPercent || 10) / 100
        : parseInt(savingsGoal === "none" ? "0" : savingsGoal) / 100;
    const disposableIncome = baseAmount * (1 - savingsRate);

    // Distribute among top categories
    const budgetCount = topCategories.length;
    const amountPerCategory = Math.round(
      (disposableIncome * 0.6) / budgetCount,
    );

    const suggestions: OnboardingSuggestions = {
      budgets: topCategories.map((cat) => ({
        category_name: cat,
        amount: amountPerCategory,
        currency: primaryCurrency,
        reasoning: `Suggested starter budget for ${cat} based on your ${budgetStyle} styling.`,
      })),
      global_budget: {
        amount: Math.round(disposableIncome),
        currency: primaryCurrency,
      },
      summary: `Here is a customized starter budget plan in ${primaryCurrency} matching your savings goal and category preferences.`,
    };

    await new Promise((resolve) => setTimeout(resolve, 1500));

    return { success: true, suggestions };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to generate suggestions",
    };
  }
}

export async function applyOnboardingSuggestions(
  suggestions: OnboardingSuggestions,
) {
  try {
    const user = await requireUser();
    const supabase = await createClient();

    const parsed = onboardingSuggestionsSchema.safeParse(suggestions);
    if (!parsed.success) {
      return { success: false, error: "Invalid suggestions schema" };
    }

    // Fetch user categories to match IDs
    const { data: userCategories } = await supabase
      .from("categories")
      .select("id, name")
      .eq("user_id", user.id);

    const findCategoryId = (name: string) => {
      // Find exact or fuzzy matching category
      return (
        userCategories?.find((c) => c.name.toLowerCase() === name.toLowerCase())
          ?.id || null
      );
    };

    const today = new Date().toISOString().split("T")[0];

    const budgetInserts = parsed.data.budgets.map((b) => ({
      user_id: user.id,
      category_id: findCategoryId(b.category_name),
      amount: b.amount,
      currency: b.currency,
      period: "monthly",
      start_date: today,
    }));

    // Add global budget if provided
    if (parsed.data.global_budget) {
      budgetInserts.push({
        user_id: user.id,
        category_id: null,
        amount: parsed.data.global_budget.amount,
        currency: parsed.data.global_budget.currency,
        period: "monthly",
        start_date: today,
      });
    }

    const { error: insertError } = await supabase
      .from("budgets")
      .insert(budgetInserts);
    if (insertError) {
      return { success: false, error: insertError.message };
    }

    // Mark complete in user metadata
    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        onboarding_complete: true,
        onboarding_completed_at: new Date().toISOString(),
      },
    });

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to apply budgets",
    };
  }
}

export async function dismissOnboarding() {
  try {
    await requireUser();
    const supabase = await createClient();

    const { error } = await supabase.auth.updateUser({
      data: {
        onboarding_complete: true,
        onboarding_completed_at: new Date().toISOString(),
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to dismiss onboarding",
    };
  }
}
