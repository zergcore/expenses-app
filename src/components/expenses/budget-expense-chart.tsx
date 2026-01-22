"use client";

import { Card } from "@/components/ui/card";
import { LegentExpenseChart } from "./expense-chart/legend-expense-chart.tsx";
import { UnbudgetedExpensesInfo } from "./expense-chart/unbudgeted-expenses-info";
import { ChartCard } from "./expense-chart/chart-card";

interface BudgetExpenseChartProps {
  totalBudget: number;
  budgetSpent: number; // Amount spent within budgeted categories
  totalExpenses: number; // Total of all expenses (including unbudgeted)
  currency?: string;
}

export function BudgetExpenseChart({
  totalBudget,
  budgetSpent,
  totalExpenses,
  currency = "USD",
}: BudgetExpenseChartProps) {
  const remaining = Math.max(totalBudget - budgetSpent, 0);
  const isOverBudget = budgetSpent > totalBudget;
  const overBudget = isOverBudget ? budgetSpent - totalBudget : 0;
  const unbudgetedAmount = Math.max(totalExpenses - budgetSpent, 0);
  const percentage =
    totalBudget > 0 ? Math.round((budgetSpent / totalBudget) * 100) : 0;

  return (
    <Card className="flex flex-col">
      <ChartCard
        isOverBudget={isOverBudget}
        percentage={percentage}
        totalBudget={totalBudget}
        overBudget={overBudget}
        budgetSpent={budgetSpent}
        remaining={remaining}
      />
      <LegentExpenseChart
        budgetSpent={budgetSpent}
        totalBudget={totalBudget}
        remaining={remaining}
        overBudget={isOverBudget}
        currency={currency}
      />

      {unbudgetedAmount > 0 && (
        <UnbudgetedExpensesInfo
          unbudgetedAmount={unbudgetedAmount}
          totalExpenses={totalExpenses}
          currency={currency}
        />
      )}
    </Card>
  );
}
