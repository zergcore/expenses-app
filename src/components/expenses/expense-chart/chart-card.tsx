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
import { chartConfig, COLORS } from "@/lib/constants";
import { Fragment } from "react/jsx-runtime";
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

  const chartData = isOverBudget
    ? [
        { name: t("Expenses.spent"), value: totalBudget, fill: COLORS.spent },
        {
          name: t("Expenses.over"),
          value: overBudget,
          fill: COLORS.over,
        },
      ]
    : [
        { name: t("Expenses.spent"), value: budgetSpent, fill: COLORS.spent },
        {
          name: t("Expenses.remaining"),
          value: remaining,
          fill: COLORS.remaining,
        },
      ];

  return (
    <Fragment>
      <CardHeader className="items-center pb-0">
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
          className="mx-auto aspect-square max-h-[250px]"
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
              innerRadius={60}
              strokeWidth={5}
            >
              <Label
                content={({ viewBox }) => {
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
                          className={`fill-foreground text-3xl font-bold ${
                            overBudget ? "fill-destructive" : ""
                          }`}
                        >
                          {percentage}%
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground text-sm"
                        >
                          {t("Expenses.of_budget")}
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Fragment>
  );
};
