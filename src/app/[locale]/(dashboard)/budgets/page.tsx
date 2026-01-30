import { getBudgets } from "@/actions/budgets";
import { getCategories } from "@/actions/categories";
import { BudgetCard } from "@/components/budgets/budget-card";
import { BudgetForm } from "@/components/budgets/budget-form";
import { BudgetsTitle } from "@/components/budgets/budgets-title";
import { NoBudgets } from "@/components/budgets/no-budgets";
import { getLocale } from "next-intl/server";

export default async function BudgetsPage() {
  const locale = await getLocale();
  // Parallel fetching using Server Actions
  const [budgets, categories] = await Promise.all([
    getBudgets(),
    getCategories(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <BudgetsTitle />
        <BudgetForm categories={categories} />
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {budgets.length > 0 ? (
          budgets.map((budget) => (
            <BudgetCard key={budget.id} budget={budget} />
          ))
        ) : (
          <NoBudgets locale={locale} />
        )}
      </div>
    </div>
  );
}
