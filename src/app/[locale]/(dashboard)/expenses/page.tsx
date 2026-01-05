import { getExpenses, getExpenseTotal } from "@/actions/expenses";
import { getCategories } from "@/actions/categories";
import { buildCategoryTree } from "@/lib/categories";
import { ExpenseForm } from "@/components/expenses/expense-form";
import { ExpensesClient } from "@/components/expenses/expenses-client";
import { MonthSelector } from "@/components/expenses/month-selector";

interface ExpensesPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

// ...

export default async function ExpensesPage({
  searchParams,
}: ExpensesPageProps) {
  const params = await searchParams;
  const month = params.month ? parseInt(params.month as string) : undefined;
  const year = params.year ? parseInt(params.year as string) : undefined;

  // Parallel fetching
  const [expensesResult, categoriesResult, totalAmount] = await Promise.all([
    getExpenses(1, 100, month, year), // Increased limit for now or need pagination metadata passed?
    getCategories(),
    getExpenseTotal(month, year),
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
        <div className="flex items-center gap-4">
          <MonthSelector />
          <ExpenseForm categories={categoryTree} />
        </div>
      </div>

      <ExpensesClient
        expenses={expenses}
        categories={categories}
        totalAmount={totalAmount}
      />
    </div>
  );
}
