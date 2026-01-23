import { COLORS } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import { useExpenseChart } from "./expense-chart-context";

export const LegendExpenseChart = () => {
  const { budgetSpent, totalBudget, remaining, isOverBudget, currency } =
    useExpenseChart();

  return (
    <div className="flex flex-wrap justify-center gap-4 px-4 pb-4 text-sm">
      <div className="flex items-center gap-2">
        <div
          className="h-3 w-3 rounded-full"
          style={{ backgroundColor: COLORS.spent }}
        />
        <span className="text-muted-foreground">
          Budgeted: {formatCurrency(budgetSpent, currency)}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div
          className="h-3 w-3 rounded-full"
          style={{
            backgroundColor: isOverBudget ? COLORS.over : COLORS.remaining,
          }}
        />
        <span className="text-muted-foreground">
          {isOverBudget
            ? `Over: ${formatCurrency(budgetSpent - totalBudget, currency)}`
            : `Remaining: ${formatCurrency(remaining, currency)}`}
        </span>
      </div>
    </div>
  );
};
