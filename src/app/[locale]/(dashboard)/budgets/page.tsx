import { getBudgets } from "@/actions/budgets";
import { getCategories } from "@/actions/categories";
import { BudgetCard } from "@/components/budgets/budget-card";
import { BudgetForm } from "@/components/budgets/budget-form";
import { BudgetsTitle } from "@/components/budgets/budgets-title";
import { NoBudgets } from "@/components/budgets/no-budgets";

export default async function BudgetsPage() {
  // Parallel fetching using Server Actions
  const [budgets, categories] = await Promise.all([
    getBudgets(),
    getCategories(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <BudgetsTitle />
        <BudgetForm categories={categories} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {budgets.length > 0 ? (
          budgets.map((budget) => (
            <BudgetCard key={budget.id} budget={budget} />
          ))
        ) : (
          <NoBudgets />
        )}
      </div>
    </div>
  );
}
