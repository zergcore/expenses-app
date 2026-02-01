/**
 * Type definitions and Zod schemas for the Financial Advisor module.
 * These types ensure type safety between the heuristics engine, AI layer, and UI.
 */

import { z } from "zod";

// --- Financial Metrics (calculated by heuristics engine) ---

export interface FinancialMetrics {
  // Spending velocity (burn rate per day)
  spendingVelocityUSD: number;
  spendingVelocityVES: number;

  // Unbudgeted spending ratio (0-1)
  unbudgetedRatio: number;
  hasUnbudgetedFriction: boolean; // true if > 10%

  // End-of-month projection
  sProj: number; // Projected total spending by month end (in USD)
  sCurrent: number; // Current total spent (in USD)

  // Time context
  daysPassed: number;
  daysRemaining: number;

  // Currency volatility (% change in rates)
  rateVolatility: number;

  // Category breakdown (anonymized)
  topCategories: Array<{
    name: string;
    amountUSD: number;
    percentage: number;
  }>;
}

// --- Anonymized Expense (for AI payload) ---

export interface AnonymizedExpense {
  amount: number;
  currency: string;
  category: string; // Category name only, no description/merchant
  date: string;
  equivalentUSD: number;
}

// --- AI Response Schema ---

export const tipTypeSchema = z.enum(["warning", "tip", "success"]);
export type TipType = z.infer<typeof tipTypeSchema>;

export const financialTipSchema = z.object({
  title: z.string().max(60),
  body: z.string().max(250),
  type: tipTypeSchema,
});
export type FinancialTip = z.infer<typeof financialTipSchema>;

export const financialInsightResponseSchema = z.object({
  tips: z.array(financialTipSchema).length(3),
  summary: z.string().max(120).optional(),
});
export type FinancialInsightResponse = z.infer<
  typeof financialInsightResponseSchema
>;

// --- Stored Insight (from Supabase) ---

export interface StoredInsight {
  id: string;
  userId: string;
  generatedAt: Date;
  validUntil: Date;
  month: number;
  year: number;
  locale: string;
  metrics: FinancialMetrics;
  tips: FinancialTip[];
  summary: string | null;
}

// --- Aggregated Data (input to AI) ---

export interface AggregatedFinancialData {
  metrics: FinancialMetrics;
  categoryTotals: Record<string, number>; // category name -> USD amount
  budgetStatus: {
    totalBudget: number;
    totalSpent: number;
    utilizationPercent: number;
  };
  rateInfo: {
    currentUSDVES: number;
    currentUSDTVES: number;
    weeklyChange: number; // % change in USD/VES rate
  };
}

// --- Locale ---

export type SupportedLocale = "es" | "en";
