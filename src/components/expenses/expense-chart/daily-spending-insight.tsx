"use client";

import { useExpenseChart } from "./expense-chart-context";
import { formatCurrency } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { TrendingDown, TrendingUp, Target } from "lucide-react";

export const DailySpendingInsight = () => {
  const {
    dailyAverageSpent,
    dailyBudgetTarget,
    daysRemaining,
    daysElapsed,
    currency,
    totalBudget,
  } = useExpenseChart();
  const t = useTranslations();

  // Don't show if no budget set
  if (totalBudget <= 0) return null;

  const isOnTrack = dailyAverageSpent <= dailyBudgetTarget;

  // Calculate daily goal based on total budget / days in month
  const daysInMonth = daysElapsed + daysRemaining;
  const dailyGoal = totalBudget / daysInMonth;

  return (
    <div className="px-3 sm:px-4 py-3 border-t">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs sm:text-sm text-muted-foreground">
            {t("Expenses.daily_average")}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <span
              className={`text-sm sm:text-base font-bold ${isOnTrack ? "text-green-500" : "text-orange-500"}`}
            >
              {formatCurrency(dailyAverageSpent, currency)}
            </span>
            <span className="text-muted-foreground text-xs sm:text-sm">
              {" "}
              / {formatCurrency(dailyGoal, currency)} {t("Expenses.goal")}
            </span>
          </div>
          {isOnTrack ? (
            <TrendingDown className="h-4 w-4 text-green-500" />
          ) : (
            <TrendingUp className="h-4 w-4 text-orange-500" />
          )}
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-1.5 text-right">
        {isOnTrack ? (
          <>
            ✓ {t("Expenses.on_track")} {daysRemaining} {t("Expenses.days_left")}
          </>
        ) : (
          <>
            {t("Expenses.reduce_to")}{" "}
            <span className="font-medium text-orange-500">
              {formatCurrency(dailyBudgetTarget, currency)}/{t("Expenses.day")}
            </span>{" "}
            {t("Expenses.to_stay_on_budget")}
          </>
        )}
      </p>
    </div>
  );
};
