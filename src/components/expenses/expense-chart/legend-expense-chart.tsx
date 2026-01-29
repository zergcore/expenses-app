import { COLORS } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import { useExpenseChart } from "./expense-chart-context";
import { useTranslations } from "next-intl";

export const LegendExpenseChart = () => {
  const { budgetSpent, totalBudget, remaining, isOverBudget, currency } =
    useExpenseChart();
  const t = useTranslations();

  return (
    <div className="flex flex-wrap justify-center gap-2 sm:gap-4 px-3 sm:px-4 pb-3 sm:pb-4 text-xs sm:text-sm">
      <div className="flex items-center gap-2">
        <div
          className="h-3 w-3 rounded-full"
          style={{ backgroundColor: COLORS.spent }}
        />
        <span className="text-muted-foreground">
          {t("Expenses.budgeted")}: {formatCurrency(budgetSpent, currency)}
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
            ? `${t("Expenses.over")}: ${formatCurrency(
                budgetSpent - totalBudget,
                currency,
              )}`
            : `${t("Expenses.remaining")}: ${formatCurrency(
                remaining,
                currency,
              )}`}
        </span>
      </div>
    </div>
  );
};
