"use client";

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { formatCurrency } from "@/lib/utils";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Plus } from "lucide-react";

interface Expense {
  id: string;
  description: string | null;
  date: string;
  amount: number;
  currency: string;
  category?: {
    icon: string | null;
  } | null;
}

interface RecentExpensesProps {
  expenses: Expense[];
  locale: string;
}

export const RecentExpenses = ({ expenses, locale }: RecentExpensesProps) => {
  const t = useTranslations("Dashboard");
  const tOnboarding = useTranslations("Onboarding");

  return (
    <Card className="md:col-span-1">
      <CardHeader>
        <CardTitle>{t("recentExpenses")}</CardTitle>
      </CardHeader>
      <CardContent>
        {expenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center space-y-4">
            <div className="rounded-full bg-muted p-4">
              <Plus className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground max-w-[200px]">
              {t("noExpenses")}
            </p>
            <Button asChild>
              <Link href={`/${locale}/expenses`}>
                {tOnboarding("empty_expense_cta")}
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {expenses.map((expense) => (
              <div
                key={expense.id}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <div className="text-lg sm:text-xl">
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
  );
};
