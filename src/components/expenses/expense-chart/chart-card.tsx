import { useMemo, useCallback } from "react";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { chartConfig, COLORS } from "@/constants/chart";
import { Label, Pie, PieChart } from "recharts";
import { useExpenseChart } from "./expense-chart-context";
import { useTranslations } from "next-intl";

export const ChartCard = () => {
  const {
    isOverBudget,
    percentage,
    totalBudget,
    overBudget,
    budgetSpent,
    remaining,
  } = useExpenseChart();
  const t = useTranslations();

  const chartData = useMemo(() => {
    return isOverBudget
      ? [
          { name: t("Expenses.spent"), value: totalBudget, fill: COLORS.spent },
          { name: t("Expenses.over"), value: overBudget, fill: COLORS.over },
        ]
      : [
          { name: t("Expenses.spent"), value: budgetSpent, fill: COLORS.spent },
          {
            name: t("Expenses.remaining"),
            value: remaining,
            fill: COLORS.remaining,
          },
        ];
  }, [isOverBudget, totalBudget, overBudget, budgetSpent, remaining, t]);

  // We type viewBox to safely accept coordinates from Recharts.
  const renderLabel = useCallback(
    ({ viewBox }: { viewBox?: { cx?: number; cy?: number; x?: number; y?: number; width?: number; height?: number } }) => {
      if (viewBox && typeof viewBox.cx === "number" && typeof viewBox.cy === "number") {
        return (
          <text
            x={viewBox.cx}
            y={viewBox.cy}
            textAnchor="middle"
            dominantBaseline="middle"
          >
            <tspan
              x={viewBox.cx}
              y={viewBox.cy}
              className={`fill-foreground text-2xl sm:text-3xl font-bold ${
                overBudget ? "fill-destructive" : ""
              }`}
            >
              {percentage}%
            </tspan>
            <tspan
              x={viewBox.cx}
              y={viewBox.cy + 20}
              className="fill-muted-foreground text-xs sm:text-sm"
            >
              {t("Expenses.of_budget")}
            </tspan>
          </text>
        );
      }
      return null;
    },
    [percentage, overBudget, t],
  );

  return (
    <>
      <CardHeader className="items-center pb-0 py-3 sm:py-6">
        <CardTitle>{t("Expenses.budget_overview")}</CardTitle>
        <CardDescription>
          {overBudget
            ? t("Expenses.over_budget")
            : t("Expenses.current_spending_status")}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[160px] sm:max-h-[200px] md:max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              innerRadius="60%"
              outerRadius="75%"
              strokeWidth={4}
            >
              <Label content={renderLabel} />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </>
  );
};
