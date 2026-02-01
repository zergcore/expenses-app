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
import { getTranslations } from "next-intl/server";
import { SmallCard } from "@/components/dashboard/small-card";
import { RecentExpenses } from "@/components/dashboard/recent-expenses";
import { OnboardingCard } from "@/components/dashboard/onboarding-card";
import { getLocale } from "next-intl/server";
import { Suspense } from "react";
import {
  FinancialInsightCard,
  FinancialInsightCardSkeleton,
} from "@/components/dashboard/financial-insight-card";

export default async function DashboardPage() {
  const user = await requireUser();
  const t = await getTranslations("Dashboard");
  const tNav = await getTranslations("Nav");
  const locale = await getLocale();

  const [totalSpent, budgets, rates, expensesResult, spendingData] =
    await Promise.all([
      getExpenseTotal(),
      getBudgets(),
      getExchangeRates(),
      getExpenses(1, 5), // Get recent expenses
      getSpendingByCategory(),
    ]);

  const recentExpenses = expensesResult?.data ?? [];
  const hasExpenses = recentExpenses.length > 0;
  const hasBudgets = budgets.length > 0;

  const usdRate = rates.find((r) => r.pair === "USD / VED");
  const usdtRate = rates.find((r) => r.pair === "USDT / USD");

  // Calculate Budget Usage
  const totalBudget = budgets.reduce((acc, b) => acc + b.amount, 0);
  const totalBudgetSpent = budgets.reduce((acc, b) => acc + b.spent, 0);
  const budgetProgress =
    totalBudget > 0 ? (totalBudgetSpent / totalBudget) * 100 : 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
          {tNav("dashboard")}
        </h1>
        <p className="text-muted-foreground">
          {t("title")}
          {user?.email ? `, ${user.email.split("@")[0]}` : ""}
        </p>
      </div>

      {/* Onboarding Card for new users */}
      <OnboardingCard
        locale={locale}
        hasExpenses={hasExpenses}
        hasBudgets={hasBudgets}
      />

      {/* AI Financial Advisor */}
      <Suspense fallback={<FinancialInsightCardSkeleton />}>
        <FinancialInsightCard />
      </Suspense>

      {/* Summary Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
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
      <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2">
        <RecentExpenses expenses={recentExpenses} locale={locale} />
        <SpendingByCategory spendingData={spendingData} locale={locale} />
      </div>
    </div>
  );
}
