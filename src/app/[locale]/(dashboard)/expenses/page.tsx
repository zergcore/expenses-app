import { getExpenses, getExpenseTotal } from "@/actions/expenses";
import { getCategories } from "@/actions/categories";
import { getBudgets } from "@/actions/budgets";
import { buildCategoryTree } from "@/lib/categories";
import { ExpenseForm } from "@/components/expenses/expense-form";
import { ExpensesClient } from "@/components/expenses/expenses-client";
import { MonthSelector } from "@/components/expenses/month-selector";
import { KPIHeader } from "@/components/expenses/kpi-header";
import { ExpenseChartProvider } from "@/components/expenses/expense-chart/expense-chart-context";
import { ExportExpensesButton } from "@/components/expenses/export-expenses-button";
import { ExpensesTitle } from "@/components/expenses/expenses-title";

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
      <div className="space-y-4">
        {/* Header section */}
        <div className="flex flex-col gap-4">
          {/* Title row with primary action */}
          <div className="flex items-start justify-between gap-4">
            <ExpensesTitle />
            {/* Primary action always visible */}
            <div className="hidden sm:block">
              <ExpenseForm categories={categoryTree} />
            </div>
          </div>

          {/* Controls row */}
          <div className="flex flex-wrap items-center gap-2">
            <MonthSelector />
            <div className="flex items-center gap-2 ml-auto">
              <ExportExpensesButton />
              <div className="sm:hidden">
                <ExpenseForm categories={categoryTree} />
              </div>
            </div>
          </div>
        </div>

        {/* KPI Header - 4 uniform cards */}
        {totalBudget > 0 && <KPIHeader />}

        {/* Full-width Expense Table */}
        <ExpensesClient
          expenses={expenses}
          categories={categories}
          totalAmount={totalAmount}
        />
      </div>
    </ExpenseChartProvider>
  );
}
