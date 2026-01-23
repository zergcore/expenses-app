import { getExpenses, getExpenseTotal } from "@/actions/expenses";
import { getCategories } from "@/actions/categories";
import { getBudgets } from "@/actions/budgets";
import { buildCategoryTree } from "@/lib/categories";
import { ExpenseForm } from "@/components/expenses/expense-form";
import { ExpensesClient } from "@/components/expenses/expenses-client";
import { MonthSelector } from "@/components/expenses/month-selector";
import { BudgetExpenseChart } from "@/components/expenses/budget-expense-chart";
import { ExpenseChartProvider } from "@/components/expenses/expense-chart/expense-chart-context";
import { ExportExpensesButton } from "@/components/expenses/export-expenses-button";

interface ExpensesPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ExpensesPage({
  searchParams,
}: ExpensesPageProps) {
  const params = await searchParams;
  const month = params.month ? parseInt(params.month as string) : undefined;
  const year = params.year ? parseInt(params.year as string) : undefined;

  // Parallel fetching
  const [expensesResult, categoriesResult, totalAmount, budgets] =
    await Promise.all([
      getExpenses(1, 100, month, year),
      getCategories(),
      getExpenseTotal(month, year),
      getBudgets(),
    ]);

  const expenses = expensesResult.data;
  const categories = categoriesResult;
  const categoryTree = buildCategoryTree(categories);

  const totalBudget = budgets.reduce((acc, b) => acc + b.amount, 0);
  const totalBudgetSpent = budgets.reduce((acc, b) => acc + b.spent, 0);

  return (
    <ExpenseChartProvider
      totalBudget={totalBudget}
      budgetSpent={totalBudgetSpent}
      totalExpenses={totalAmount}
      currency="USD"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Expenses</h1>
            <p className="text-muted-foreground">
              View and manage your transaction history
            </p>
          </div>
          <div className="flex items-center gap-4">
            <ExportExpensesButton />
            <MonthSelector />
            <ExpenseForm categories={categoryTree} />
          </div>
        </div>

        {/* Budget vs Expenses Chart */}
        {totalBudget > 0 && (
          <div className="max-w-md">
            <BudgetExpenseChart />
          </div>
        )}

        <ExpensesClient
          expenses={expenses}
          categories={categories}
          totalAmount={totalAmount}
        />
      </div>
    </ExpenseChartProvider>
  );
}
