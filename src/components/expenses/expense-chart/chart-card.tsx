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

interface ChartCardProps {
  isOverBudget: boolean;
  percentage: number;
  totalBudget: number;
  overBudget: number;
  budgetSpent: number;
  remaining: number;
}

export const ChartCard = ({
  isOverBudget,
  percentage,
  totalBudget,
  overBudget,
  budgetSpent,
  remaining,
}: ChartCardProps) => {
  const chartData = isOverBudget
    ? [
        { name: "spent", value: totalBudget, fill: COLORS.spent },
        {
          name: "over",
          value: overBudget,
          fill: COLORS.over,
        },
      ]
    : [
        { name: "spent", value: budgetSpent, fill: COLORS.spent },
        { name: "remaining", value: remaining, fill: COLORS.remaining },
      ];

  return (
    <Fragment>
      <CardHeader className="items-center pb-0">
        <CardTitle>Budget Overview</CardTitle>
        <CardDescription>
          {overBudget ? "You are over budget!" : "Current spending status"}
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
                          of budget
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
