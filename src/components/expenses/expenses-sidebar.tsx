"use client";

import { Card } from "@/components/ui/card";
import { ChartCard } from "./expense-chart/chart-card";
import { LegendExpenseChart } from "./expense-chart/legend-expense-chart";
import { DailySpendingInsight } from "./expense-chart/daily-spending-insight";
import { UnbudgetedExpensesInfo } from "./expense-chart/unbudgeted-expenses-info";
import { useExpenseChart } from "./expense-chart/expense-chart-context";
import { formatCurrency } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { TrendingUp, Calendar } from "lucide-react";

export const ExpensesSidebar = () => {
  const {
    projectedSpending,
    totalBudget,
    currency,
    daysRemaining,
    unbudgetedAmount,
  } = useExpenseChart();
  const t = useTranslations();

  const isProjectedOverBudget = projectedSpending > totalBudget;

  return (
    <div className="space-y-4 lg:sticky lg:top-4">
      {/* Budget Overview Card */}
      <Card className="overflow-hidden">
        <ChartCard />
        <LegendExpenseChart />
        <DailySpendingInsight />
        {unbudgetedAmount > 0 && <UnbudgetedExpensesInfo />}
      </Card>

      {/* Projected Spending Card */}
      {totalBudget > 0 && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {t("Expenses.projected_spending")}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p
                className={`text-2xl font-bold ${isProjectedOverBudget ? "text-orange-500" : "text-foreground"}`}
              >
                {formatCurrency(projectedSpending, currency)}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("Expenses.by_month_end")}
              </p>
            </div>
            {isProjectedOverBudget && (
              <div className="flex items-center gap-1 text-orange-500">
                <TrendingUp className="h-4 w-4" />
                <span className="text-xs font-medium">
                  +{formatCurrency(projectedSpending - totalBudget, currency)}
                </span>
              </div>
            )}
          </div>

          <p className="text-xs text-muted-foreground mt-2">
            {daysRemaining} {t("Expenses.days_remaining_month")}
          </p>
        </Card>
      )}
    </div>
  );
};
