import { COLORS } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";

interface UnbudgetedExpensesInfoProps {
  unbudgetedAmount: number;
  totalExpenses: number;
  currency: string;
}

export const UnbudgetedExpensesInfo = ({
  unbudgetedAmount,
  totalExpenses,
  currency,
}: UnbudgetedExpensesInfoProps) => {
  return (
    <div className="border-t px-4 py-3">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: COLORS.unbudgeted }}
          />
          <span className="text-muted-foreground">Unbudgeted expenses</span>
        </div>
        <span className="font-medium" style={{ color: COLORS.unbudgeted }}>
          {formatCurrency(unbudgetedAmount, currency)}
        </span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        These expenses are in categories without a budget assigned
      </p>
      <div className="mt-2 flex items-center justify-between border-t pt-2 text-sm">
        <span className="font-medium">Total Monthly Expenses</span>
        <span className="font-bold">
          {formatCurrency(totalExpenses, currency)}
        </span>
      </div>
    </div>
  );
};
