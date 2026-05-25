import { z } from "zod";

export const onboardingAnswersSchema = z.object({
  primaryCurrency: z.enum(["USD", "USDT", "VES", "EUR"]),
  incomeRange: z.enum(["under_500", "500_1000", "1000_3000", "3000_5000", "over_5000"]),
  topCategories: z.array(z.string()).min(1).max(4),
  savingsGoal: z.enum(["none", "5", "10", "20", "custom"]),
  customSavingsPercent: z.number().min(1).max(50).optional(),
  budgetStyle: z.enum(["strict", "flexible"]),
});

export type OnboardingAnswers = z.infer<typeof onboardingAnswersSchema>;

export const onboardingSuggestionsSchema = z.object({
  budgets: z.array(
    z.object({
      category_name: z.string().max(60),
      amount: z.number().positive(),
      currency: z.enum(["USD", "USDT", "VES", "EUR"]),
      reasoning: z.string().max(120),
    })
  ).min(1).max(8),
  global_budget: z.object({
    amount: z.number().positive(),
    currency: z.enum(["USD", "USDT", "VES", "EUR"]),
  }).optional(),
  summary: z.string().max(280).optional(),
});

export type OnboardingSuggestions = z.infer<typeof onboardingSuggestionsSchema>;
