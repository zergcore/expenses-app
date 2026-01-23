import { getExpenseTotal } from "@/actions/expenses";
import { getBudgets } from "@/actions/budgets";
import { getExchangeRates } from "@/actions/rates";
import { formatCurrency } from "@/lib/utils";
import { requireUser } from "@/lib/auth/server";
import { SpendingByCategory } from "@/components/dashboard/spending-by-category";
import { getTranslations } from "next-intl/server";
import { SmallCard } from "@/components/dashboard/small-card";
import { RecentExpenses } from "@/components/dashboard/recent-expenses";

export default async function DashboardPage() {
  const user = await requireUser();
  const t = await getTranslations("Dashboard");

  const [totalSpent, budgets, rates] = await Promise.all([
    getExpenseTotal(),
    getBudgets(),
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
          {t("title")}
          {user?.email ? `, ${user.email.split("@")[0]}` : ""}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SmallCard
          title={t("totalSpent")}
          value={formatCurrency(totalSpent)}
          description={t("thisMonth")}
        />
        <SmallCard
          title={t("budgetUsed")}
          value={`${Math.round(budgetProgress).toString()}%`}
          description={t("thisMonth")}
        />
        <SmallCard
          title={t("usdRate")}
          value={usdRate?.rate || "--"}
          description={t("bsPerUsd")}
        />
        <SmallCard
          title={t("usdtRate")}
          value={usdtRate?.rate || "--"}
          description={t("bsPerUsdt")}
        />
      </div>

      {/* Recent Expenses & Categories */}
      <div className="grid gap-4 md:grid-cols-2">
        <RecentExpenses />
        <SpendingByCategory />
      </div>
    </div>
  );
}
