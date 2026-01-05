import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getExpenseTotal,
  getExpenses,
  getSpendingByCategory,
} from "@/actions/expenses";
import { getBudgets } from "@/actions/budgets";
import { getExchangeRates } from "@/actions/rates";
import { formatCurrency } from "@/lib/utils";
import { requireUser } from "@/lib/auth/server";
import { SpendingByCategory } from "@/components/dashboard/spending-by-category";

export default async function DashboardPage() {
  const user = await requireUser();

  const [totalSpent, recentExpenses, budgets, spendingByCategory, rates] =
    await Promise.all([
      getExpenseTotal(),
      getExpenses(1, 5),
      getBudgets(),
      getSpendingByCategory(),
      getExchangeRates(),
    ]);

  const usdRate = rates.find((r) => r.pair === "USD / VED");
  const usdtRate = rates.find((r) => r.pair === "USDT / USD");

  // Calculate Budget Usage
  const totalBudget = budgets.reduce((acc, b) => acc + b.amount, 0);
  const totalBudgetSpent = budgets.reduce((acc, b) => acc + b.spent, 0);
  const budgetProgress =
    totalBudget > 0 ? (totalBudgetSpent / totalBudget) * 100 : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back{user?.email ? `, ${user.email.split("@")[0]}` : ""}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalSpent)}
            </div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget Used</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(budgetProgress)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(totalBudgetSpent)} of{" "}
              {formatCurrency(totalBudget)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              USD Rate (BCV)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usdRate?.rate || "--"}</div>
            <p className="text-xs text-muted-foreground">Bs. per USD</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">USDT Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usdtRate?.rate || "--"}</div>
            <p className="text-xs text-muted-foreground">USD per USDT</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Expenses & Categories */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Recent Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            {recentExpenses.data.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No expenses recorded yet. Add your first expense to get started.
              </p>
            ) : (
              <div className="space-y-4">
                {recentExpenses.data.map((expense) => (
                  <div
                    key={expense.id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div className="text-xl">
                        {expense.category?.icon || "💰"}
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {expense.description || "Uncategorized"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(expense.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="font-medium">
                      {formatCurrency(expense.amount, expense.currency)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <SpendingByCategory data={spendingByCategory} />
      </div>
    </div>
  );
}
