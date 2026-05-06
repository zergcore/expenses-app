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

  // FIX IS HERE:
  // We use `viewBox?: any` to accept both Polar and Cartesian boxes from Recharts types.
  // The `if` check inside ensures we only run logic if cx/cy actually exist.
  const renderLabel = useCallback(
    ({ viewBox }: { viewBox?: any }) => {
      if (viewBox && "cx" in viewBox && "cy" in viewBox) {
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
              y={(viewBox.cy || 0) + 20}
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
