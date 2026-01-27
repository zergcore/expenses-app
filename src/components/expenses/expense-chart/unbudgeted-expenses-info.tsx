import { COLORS } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import { useExpenseChart } from "./expense-chart-context";
import { useTranslations } from "next-intl";

export const UnbudgetedExpensesInfo = () => {
  const { unbudgetedAmount, totalExpenses, currency } = useExpenseChart();
  const t = useTranslations();

  return (
    <div className="border-t px-4 py-3">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: COLORS.unbudgeted }}
          />
          <span className="text-muted-foreground">
            {t("Expenses.unbudgeted_expenses")}
          </span>
        </div>
        <span className="font-medium" style={{ color: COLORS.unbudgeted }}>
          {formatCurrency(unbudgetedAmount, currency)}
        </span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {t("Expenses.unbudgeted_expenses_info")}
      </p>
      <div className="mt-2 flex items-center justify-between border-t pt-2 text-sm">
        <span className="font-medium">
          {t("Expenses.total_monthly_expenses")}
        </span>
        <span className="font-bold">
          {formatCurrency(totalExpenses, currency)}
        </span>
      </div>
    </div>
  );
};
