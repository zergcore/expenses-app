import { DataTable } from "@/components/expenses/data-table";
import { columns } from "@/components/expenses/columns";
import { getExpenses } from "@/actions/expenses";
import { getCategories } from "@/actions/categories";
import { buildCategoryTree } from "@/lib/categories";
import { createClient } from "@/lib/supabase/server";
import { ExpenseForm } from "@/components/expenses/expense-form";

export default async function ExpensesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Parallel fetching
  const [expensesResult, categoriesResult] = await Promise.all([
    getExpenses(user.id),
    getCategories(),
  ]);

  const expenses = expensesResult.data;
  const categories = categoriesResult;
  const categoryTree = buildCategoryTree(categories);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Expenses</h1>
          <p className="text-muted-foreground">
            View and manage your transaction history
          </p>
        </div>
        <ExpenseForm categories={categoryTree} />
      </div>

      <DataTable columns={columns} data={expenses} />
    </div>
  );
}
