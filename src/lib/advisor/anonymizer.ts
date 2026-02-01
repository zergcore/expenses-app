/**
 * Anonymization Layer for the Financial Advisor module.
 *
 * This module ensures that no Personally Identifiable Information (PII)
 * is ever sent to the AI service. It transforms raw expense data into
 * generic, anonymized representations.
 *
 * SECURITY GUARDRAIL: This layer is the ONLY path through which expense
 * data should flow before being sent to external AI services.
 */

import type { AnonymizedExpense } from "./types";

// --- Raw expense type from the database ---

interface RawExpense {
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
  equivalents: {
    usd: number;
    ves: number;
    usdt: number;
    eur: number;
  } | null;
}

/**
 * Anonymizes a single expense for AI consumption.
 * Removes all PII: descriptions, merchant names, receipt data.
 * Only retains: amount, currency, category name, date, USD equivalent.
 */
export function anonymizeExpense(expense: RawExpense): AnonymizedExpense {
  return {
    amount: expense.amount,
    currency: expense.currency,
    // Use category name only, never description/merchant
    category: expense.category?.name || "Uncategorized",
    date: expense.date,
    // Use pre-calculated USD equivalent for consistent aggregation
    equivalentUSD: expense.equivalents?.usd || 0,
  };
}

/**
 * Anonymizes a batch of expenses.
 * This is the primary entry point for anonymization.
 */
export function anonymizeExpenses(expenses: RawExpense[]): AnonymizedExpense[] {
  return expenses.map(anonymizeExpense);
}

/**
 * Aggregates anonymized expenses by category.
 * Returns a map of category name to total USD amount.
 */
export function aggregateByCategory(
  expenses: AnonymizedExpense[],
): Record<string, number> {
  const categoryTotals: Record<string, number> = {};

  for (const expense of expenses) {
    const category = expense.category;
    if (!categoryTotals[category]) {
      categoryTotals[category] = 0;
    }
    categoryTotals[category] += expense.equivalentUSD;
  }

  return categoryTotals;
}

/**
 * Calculates spending by original currency.
 * Returns totals for VES, USD, USDT, EUR.
 */
export function aggregateByCurrency(
  expenses: AnonymizedExpense[],
): Record<string, number> {
  const currencyTotals: Record<string, number> = {
    VES: 0,
    USD: 0,
    USDT: 0,
    EUR: 0,
  };

  for (const expense of expenses) {
    const currency = expense.currency.toUpperCase();
    if (currency in currencyTotals) {
      currencyTotals[currency] += expense.amount;
    }
  }

  return currencyTotals;
}

/**
 * Validates that no PII leaks into the anonymized data.
 * Throws an error if any suspicious patterns are detected.
 * This is a defensive check, not a replacement for proper anonymization.
 */
export function validateNoPI(data: unknown): void {
  const stringified = JSON.stringify(data);

  // Check for common PII patterns
  const piiPatterns = [
    /@[a-z0-9.-]+\.[a-z]{2,}/i, // Email addresses
    /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/, // Card numbers
    /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/, // Phone numbers
  ];

  for (const pattern of piiPatterns) {
    if (pattern.test(stringified)) {
      throw new Error(
        "Potential PII detected in anonymized data. Aborting AI request.",
      );
    }
  }
}
