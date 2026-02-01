/**
 * Heuristics Engine for the Financial Advisor module.
 *
 * This module calculates key financial metrics from aggregated expense data.
 * All calculations are performed server-side with anonymized data.
 *
 * Key Metrics:
 * 1. Spending Velocity: Daily burn rate by currency
 * 2. Unbudgeted Friction: Ratio of unbudgeted to total spending
 * 3. S_proj: End-of-month spending projection
 * 4. Rate Volatility: Currency fluctuation impact
 */

import type {
  AnonymizedExpense,
  FinancialMetrics,
  AggregatedFinancialData,
} from "./types";
import { aggregateByCategory, aggregateByCurrency } from "./anonymizer";

// --- Time Utilities ---

/**
 * Gets the number of days that have passed in the current month.
 */
export function getDaysPassed(referenceDate: Date = new Date()): number {
  return referenceDate.getDate();
}

/**
 * Gets the number of days remaining in the current month.
 */
export function getDaysRemaining(referenceDate: Date = new Date()): number {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  const lastDay = new Date(year, month + 1, 0).getDate();
  return lastDay - referenceDate.getDate();
}

/**
 * Gets the total number of days in the current month.
 */
export function getDaysInMonth(referenceDate: Date = new Date()): number {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  return new Date(year, month + 1, 0).getDate();
}

// --- Core Metric Calculations ---

/**
 * Calculates spending velocity (burn rate) per day.
 *
 * Formula: velocity = totalSpent / daysPassed
 */
export function calculateSpendingVelocity(
  totalSpent: number,
  daysPassed: number,
): number {
  if (daysPassed <= 0) return 0;
  return totalSpent / daysPassed;
}

/**
 * Calculates end-of-month spending projection.
 *
 * Formula (LaTeX): S_{proj} = S_{current} + (S_{current} / D_{passed}) × D_{remaining}
 *
 * @param sCurrent - Current total spending
 * @param daysPassed - Days elapsed in the month
 * @param daysRemaining - Days left in the month
 * @returns Projected total spending by month end
 */
export function calculateSProj(
  sCurrent: number,
  daysPassed: number,
  daysRemaining: number,
): number {
  if (daysPassed <= 0) return sCurrent;

  const dailyRate = sCurrent / daysPassed;
  const projected = sCurrent + dailyRate * daysRemaining;

  // Round to 2 decimal places
  return Math.round(projected * 100) / 100;
}

/**
 * Calculates unbudgeted spending ratio.
 *
 * @param unbudgetedSpending - Total spending not assigned to any budget
 * @param totalSpending - Total spending across all categories
 * @returns Ratio between 0 and 1
 */
export function calculateUnbudgetedRatio(
  unbudgetedSpending: number,
  totalSpending: number,
): number {
  if (totalSpending <= 0) return 0;
  return unbudgetedSpending / totalSpending;
}

/**
 * Calculates rate volatility as percentage change.
 *
 * @param currentRate - Current USD/VES rate
 * @param previousRate - Rate from comparison period (e.g., week ago)
 * @returns Percentage change (can be negative)
 */
export function calculateRateVolatility(
  currentRate: number,
  previousRate: number,
): number {
  if (previousRate <= 0) return 0;
  const change = ((currentRate - previousRate) / previousRate) * 100;
  return Math.round(change * 100) / 100;
}

// --- Top Categories ---

/**
 * Gets the top N categories by spending (in USD).
 */
export function getTopCategories(
  categoryTotals: Record<string, number>,
  totalUSD: number,
  limit: number = 5,
): Array<{ name: string; amountUSD: number; percentage: number }> {
  const sorted = Object.entries(categoryTotals)
    .map(([name, amountUSD]) => ({
      name,
      amountUSD: Math.round(amountUSD * 100) / 100,
      percentage:
        totalUSD > 0 ? Math.round((amountUSD / totalUSD) * 10000) / 100 : 0,
    }))
    .sort((a, b) => b.amountUSD - a.amountUSD);

  return sorted.slice(0, limit);
}

// --- Main Aggregation Function ---

interface RawBudget {
  id: string;
  amount: number;
  currency: string;
  category_id: string | null;
  spent: number;
}

interface RateInfo {
  currentUSDVES: number;
  currentUSDTVES: number;
  previousUSDVES: number; // For volatility calculation
}

/**
 * Calculates all financial metrics from raw data.
 * This is the main entry point for the heuristics engine.
 */
export function calculateFinancialMetrics(
  expenses: AnonymizedExpense[],
  budgets: RawBudget[],
  rateInfo: RateInfo,
  referenceDate: Date = new Date(),
): AggregatedFinancialData {
  // Time context
  const daysPassed = getDaysPassed(referenceDate);
  const daysRemaining = getDaysRemaining(referenceDate);

  // Aggregate by category and currency
  const categoryTotals = aggregateByCategory(expenses);
  const currencyTotals = aggregateByCurrency(expenses);

  // Total spending in USD (summing all USD equivalents)
  const totalUSD = expenses.reduce((sum, e) => sum + e.equivalentUSD, 0);

  // Calculate which expenses are in budgeted categories
  const budgetedCategoryIds = new Set(
    budgets.filter((b) => b.category_id).map((b) => b.category_id),
  );
  const hasGlobalBudget = budgets.some((b) => !b.category_id);

  // Unbudgeted spending = expenses in categories that have no budget
  // If there's a global budget, all spending is "budgeted"
  let unbudgetedSpending = 0;
  if (!hasGlobalBudget) {
    for (const expense of expenses) {
      // Check if the expense's category has a budget
      const categoryHasBudget = Array.from(budgetedCategoryIds).some(() => {
        // We only have category names in anonymized data, so we approximate
        // by checking if any budget exists for non-null categories
        return budgets.length > 0;
      });

      if (!categoryHasBudget) {
        unbudgetedSpending += expense.equivalentUSD;
      }
    }

    // Simplified: if no specific category budgets, count uncategorized as unbudgeted
    unbudgetedSpending = categoryTotals["Uncategorized"] || 0;
  }

  // Budget status
  const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
  const totalBudgetSpent = budgets.reduce((sum, b) => sum + b.spent, 0);

  // Core metrics
  const spendingVelocityUSD = calculateSpendingVelocity(totalUSD, daysPassed);
  const spendingVelocityVES = calculateSpendingVelocity(
    currencyTotals.VES,
    daysPassed,
  );
  const unbudgetedRatio = calculateUnbudgetedRatio(
    unbudgetedSpending,
    totalUSD,
  );
  const sProj = calculateSProj(totalUSD, daysPassed, daysRemaining);
  const rateVolatility = calculateRateVolatility(
    rateInfo.currentUSDVES,
    rateInfo.previousUSDVES,
  );

  const metrics: FinancialMetrics = {
    spendingVelocityUSD: Math.round(spendingVelocityUSD * 100) / 100,
    spendingVelocityVES: Math.round(spendingVelocityVES * 100) / 100,
    unbudgetedRatio: Math.round(unbudgetedRatio * 10000) / 10000,
    hasUnbudgetedFriction: unbudgetedRatio > 0.1, // > 10%
    sProj,
    sCurrent: Math.round(totalUSD * 100) / 100,
    daysPassed,
    daysRemaining,
    rateVolatility,
    topCategories: getTopCategories(categoryTotals, totalUSD),
  };

  return {
    metrics,
    categoryTotals,
    budgetStatus: {
      totalBudget,
      totalSpent: totalBudgetSpent,
      utilizationPercent:
        totalBudget > 0
          ? Math.round((totalBudgetSpent / totalBudget) * 10000) / 100
          : 0,
    },
    rateInfo: {
      currentUSDVES: rateInfo.currentUSDVES,
      currentUSDTVES: rateInfo.currentUSDTVES,
      weeklyChange: rateVolatility,
    },
  };
}
