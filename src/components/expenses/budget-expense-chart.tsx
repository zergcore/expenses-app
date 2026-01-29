"use client";

import { Card } from "@/components/ui/card";
import { LegendExpenseChart } from "./expense-chart/legend-expense-chart";
import { UnbudgetedExpensesInfo } from "./expense-chart/unbudgeted-expenses-info";
import { DailySpendingInsight } from "./expense-chart/daily-spending-insight";
import { ChartCard } from "./expense-chart/chart-card";
import { useExpenseChart } from "./expense-chart/expense-chart-context";

export function BudgetExpenseChart() {
  const { unbudgetedAmount } = useExpenseChart();

  return (
    <Card className="flex flex-col">
      <ChartCard />
      <LegendExpenseChart />
      <DailySpendingInsight />
      {unbudgetedAmount > 0 && <UnbudgetedExpensesInfo />}
    </Card>
  );
}
