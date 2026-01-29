"use client";

import { createContext, useContext, ReactNode } from "react";

interface ExpenseChartContextType {
  // Input props
  totalBudget: number;
  budgetSpent: number;
  totalExpenses: number;
  currency: string;

  // Derived values
  remaining: number;
  isOverBudget: boolean;
  overBudget: number;
  unbudgetedAmount: number;
  percentage: number;
  // Daily spending insights
  dailyAverageSpent: number;
  dailyBudgetTarget: number;
  daysRemaining: number;
  daysElapsed: number;
  projectedSpending: number;
}

const ExpenseChartContext = createContext<ExpenseChartContextType | null>(null);

interface ExpenseChartProviderProps {
  children: ReactNode;
  totalBudget: number;
  budgetSpent: number;
  totalExpenses: number;
  currency: string;
}

export function ExpenseChartProvider({
  children,
  totalBudget,
  budgetSpent,
  totalExpenses,
  currency,
}: ExpenseChartProviderProps) {
  const remaining = Math.max(totalBudget - budgetSpent, 0);
  const isOverBudget = budgetSpent > totalBudget;
  const overBudget = isOverBudget ? budgetSpent - totalBudget : 0;
  const unbudgetedAmount = Math.max(totalExpenses - budgetSpent, 0);
  const percentage =
    totalBudget > 0 ? Math.round((budgetSpent / totalBudget) * 100) : 0;

  // Daily spending insights
  const now = new Date();
  const daysElapsed = now.getDate();
  const daysInMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
  ).getDate();
  const daysRemaining = daysInMonth - daysElapsed;
  const dailyAverageSpent = daysElapsed > 0 ? totalExpenses / daysElapsed : 0;
  const dailyBudgetTarget =
    daysRemaining > 0 ? (totalBudget - budgetSpent) / daysRemaining : 0;

  // Projected end-of-month spending: P = (A × D) + S
  // Where A = daily average, D = remaining days, S = current total spent
  const projectedSpending = dailyAverageSpent * daysRemaining + totalExpenses;

  const value = {
    totalBudget,
    budgetSpent,
    totalExpenses,
    currency,
    remaining,
    isOverBudget,
    overBudget,
    unbudgetedAmount,
    percentage,
    dailyAverageSpent,
    dailyBudgetTarget,
    daysRemaining,
    daysElapsed,
    projectedSpending,
  };

  return (
    <ExpenseChartContext.Provider value={value}>
      {children}
    </ExpenseChartContext.Provider>
  );
}

export function useExpenseChart() {
  const context = useContext(ExpenseChartContext);
  if (!context) {
    throw new Error(
      "useExpenseChart must be used within an ExpenseChartProvider",
    );
  }
  return context;
}
