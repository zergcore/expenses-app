import { Button } from "@/components/ui/button";
import { ReceiptText, Plus } from "lucide-react";
import { useTranslations } from "next-intl";

interface Props {
  variant: "no_expenses" | "no_filter_match";
  onAddExpense?: () => void;
  onClearFilters?: () => void;
}

export function ExpensesEmptyState({ variant, onAddExpense, onClearFilters }: Props) {
  const t = useTranslations("Expenses");

  if (variant === "no_filter_match") {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <ReceiptText className="h-12 w-12 text-muted-foreground/50 mb-3" strokeWidth={1.25} />
        <h3 className="text-base font-medium text-foreground mb-1">
          {t("empty_no_filter_match") || "No expenses match your filters."}
        </h3>
        <Button variant="outline" size="sm" className="mt-4 cursor-pointer" onClick={onClearFilters}>
          {t("empty_clear_filters") || "Clear filters"}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="h-16 w-16 rounded-full bg-muted/40 flex items-center justify-center mb-4">
        <ReceiptText className="h-8 w-8 text-muted-foreground" strokeWidth={1.5} />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">
        {t("empty_title") || "No expenses yet"}
      </h3>
      <p className="text-sm text-muted-foreground max-w-xs mb-6">
        {t("empty_description") || "Track your first expense to start building your financial picture."}
      </p>
      {onAddExpense && (
        <Button onClick={onAddExpense} className="cursor-pointer">
          <Plus className="h-4 w-4 mr-1" />
          {t("empty_cta") || "Add your first expense"}
        </Button>
      )}
    </div>
  );
}
