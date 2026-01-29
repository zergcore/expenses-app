import { formatCurrency } from "@/lib/utils";
import { useExpenseChart } from "./expense-chart-context";
import { useTranslations } from "next-intl";
import { AlertTriangle, Tags } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const UnbudgetedExpensesInfo = () => {
  const { unbudgetedAmount, totalExpenses, currency } = useExpenseChart();
  const t = useTranslations();

  return (
    <div className="border-t border-amber-500/30 bg-amber-500/10 px-4 py-3 rounded-b-lg">
      {/* Warning header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <span className="text-sm font-medium text-amber-500">
            {t("Expenses.unbudgeted_expenses")}
          </span>
        </div>
        <span className="text-base font-bold text-amber-500">
          {formatCurrency(unbudgetedAmount, currency)}
        </span>
      </div>

      {/* Description */}
      <p className="mt-1 text-xs text-muted-foreground">
        {t("Expenses.unbudgeted_expenses_info")}
      </p>

      {/* CTA Button */}
      <Link href="/categories">
        <Button
          variant="outline"
          size="sm"
          className="mt-2 w-full border-amber-500/50 text-amber-500 hover:bg-amber-500/10 hover:text-amber-400"
        >
          <Tags className="h-4 w-4 mr-2" />
          {t("Expenses.assign_category")}
        </Button>
      </Link>

      {/* Total monthly expenses */}
      <div className="mt-3 flex items-center justify-between border-t border-amber-500/20 pt-2 text-sm">
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
