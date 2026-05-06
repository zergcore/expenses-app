"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useExpenseChart } from "./expense-chart/expense-chart-context";
import { formatCurrency } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { PieChart, Pie, Cell } from "recharts";
import {
  TrendingUp,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Target,
} from "lucide-react";
import { COLORS } from "@/constants/chart";
import { cn } from "@/lib/utils";
import { StatCard } from "./kpi/stat-card";
import { useMemo } from "react";

export const KPIHeader = () => {
  const {
    percentage,
    totalBudget,
    budgetSpent,
    remaining,
    isOverBudget,
    currency,
    dailyAverageSpent,
    dailyBudgetTarget,
    daysRemaining,
    daysElapsed,
    projectedSpending,
    unbudgetedAmount,
  } = useExpenseChart();
  const t = useTranslations();

  // --- 2. Memoize Calculations ---
  // Prevents re-calculation and reference changes on every render
  const { daysInMonth, dailyGoal, isOnTrack, isProjectedOverBudget } =
    useMemo(() => {
      const daysInMonth = daysElapsed + daysRemaining;
      return {
        daysInMonth,
        dailyGoal: totalBudget / (daysInMonth || 1), // Avoid division by zero
        isOnTrack: dailyAverageSpent <= dailyBudgetTarget,
        isProjectedOverBudget: projectedSpending > totalBudget,
      };
    }, [
      daysElapsed,
      daysRemaining,
      totalBudget,
      dailyAverageSpent,
      dailyBudgetTarget,
      projectedSpending,
    ]);

  const donutData = useMemo(
    () =>
      isOverBudget
        ? [
            { value: totalBudget, fill: COLORS.spent },
            {
              value: Math.max(0, budgetSpent - totalBudget),
              fill: COLORS.over,
            },
          ]
        : [
            { value: budgetSpent, fill: COLORS.spent },
            { value: remaining, fill: COLORS.remaining },
          ],
    [isOverBudget, totalBudget, budgetSpent, remaining],
  );

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Budget Summary (Unique Layout) */}
      <Card className="relative overflow-hidden bg-linear-to-br from-card to-card/80 border-border/50 hover:border-primary/30 transition-colors">
        <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-primary/60 via-primary to-primary/60" />
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 flex-shrink-0">
              {/* Optimization: Removed ResponsiveContainer for fixed dimensions */}
              <PieChart width={64} height={64}>
                <Pie
                  data={donutData}
                  dataKey="value"
                  innerRadius={22}
                  outerRadius={30}
                  strokeWidth={0}
                  isAnimationActive={false} // Performance boost
                >
                  {donutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
              <div className="absolute inset-0 flex items-center justify-center">
                <span
                  className={cn(
                    "text-sm font-bold",
                    isOverBudget ? "text-destructive" : "text-primary",
                  )}
                >
                  {percentage}%
                </span>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                {t("Expenses.budget_overview")}
              </p>
              <p className="text-xl font-bold text-foreground">
                {formatCurrency(budgetSpent, currency)}
              </p>
              <p className="text-sm text-muted-foreground">
                / {formatCurrency(totalBudget, currency)}
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border/50">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-muted-foreground">
                {t("Expenses.days_passed")}
              </span>
              <span className="text-xs font-medium text-foreground">
                {daysElapsed}/{daysInMonth}
              </span>
            </div>
            <div className="h-1.5 bg-muted/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary/80 to-primary rounded-full transition-all"
                style={{ width: `${(daysElapsed / daysInMonth) * 100}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Daily Average */}
      <StatCard
        title={t("Expenses.daily_average")}
        value={formatCurrency(dailyAverageSpent, currency)}
        subValue={
          <>
            / {formatCurrency(dailyGoal, currency)} {t("Expenses.goal")}
          </>
        }
        icon={Target}
        statusColor={isOnTrack ? "text-green-500" : "text-orange-500"}
        statusBg={isOnTrack ? "bg-green-500/10" : "bg-orange-500/10"}
        accentColor={isOnTrack ? "from-green-500" : "from-orange-500"}
        trendIcon={
          isOnTrack ? (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          ) : (
            <TrendingUp className="h-5 w-5 text-orange-500" />
          )
        }
      />

      {/* 3. EOM Projection */}
      <StatCard
        title={t("Expenses.projected_spending")}
        value={formatCurrency(projectedSpending, currency)}
        subValue={`${daysRemaining} ${t("Expenses.days_remaining_month")}`}
        icon={Calendar}
        statusColor={
          isProjectedOverBudget ? "text-orange-500" : "text-foreground"
        }
        statusBg={isProjectedOverBudget ? "bg-orange-500/10" : "bg-blue-500/10"}
        accentColor={
          isProjectedOverBudget ? "from-orange-500" : "from-blue-500"
        }
        trendIcon={
          isProjectedOverBudget && (
            <TrendingUp className="h-5 w-5 text-orange-500" />
          )
        }
      />

      {/* 4. Unbudgeted Total */}
      <StatCard
        title={t("Expenses.unbudgeted_expenses")}
        value={formatCurrency(unbudgetedAmount, currency)}
        subValue={
          unbudgetedAmount > 0 ? (
            <span className="text-amber-500/80">
              {t("Expenses.needs_category")}
            </span>
          ) : (
            <span className="text-green-500/80">
              ✓ {t("Expenses.all_categorized")}
            </span>
          )
        }
        icon={AlertTriangle}
        statusColor={unbudgetedAmount > 0 ? "text-amber-500" : "text-green-500"}
        statusBg={unbudgetedAmount > 0 ? "bg-amber-500/10" : "bg-green-500/10"}
        accentColor={unbudgetedAmount > 0 ? "from-amber-500" : "from-green-500"}
        borderColor={
          unbudgetedAmount > 0
            ? "border-amber-500/30 hover:border-amber-500/50"
            : "hover:border-green-500/30"
        }
      />
    </div>
  );
};
