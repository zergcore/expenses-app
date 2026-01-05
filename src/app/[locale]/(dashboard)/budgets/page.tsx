import { getBudgets } from "@/actions/budgets";
import { getCategories } from "@/actions/categories";
import { BudgetCard } from "@/components/budgets/budget-card";
import { BudgetForm } from "@/components/budgets/budget-form";

export default async function BudgetsPage() {
  // Parallel fetching using Server Actions
  const [budgets, categories] = await Promise.all([
    getBudgets(),
    getCategories(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Budgets</h1>
          <p className="text-muted-foreground">
            Manage your spending limits and track progress
          </p>
        </div>
        <BudgetForm categories={categories} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {budgets.length > 0 ? (
          budgets.map((budget) => (
            <BudgetCard key={budget.id} budget={budget} />
          ))
        ) : (
          <div className="col-span-full flex h-40 items-center justify-center rounded-lg border border-dashed">
            <p className="text-muted-foreground">
              No budgets set. Create one to start tracking.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
