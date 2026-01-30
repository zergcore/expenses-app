"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { formatCurrency, getCategoryName } from "@/lib/utils";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { PieChart } from "lucide-react";

interface SpendingItem {
  amount: number;
  percentage: number;
  category: {
    id?: string;
    name: string;
    icon: string | null;
    color: string | null;
    is_default: boolean;
  } | null;
}

interface SpendingByCategoryProps {
  spendingData: SpendingItem[];
  locale: string;
}

export function SpendingByCategory({
  spendingData,
  locale,
}: SpendingByCategoryProps) {
  const t = useTranslations();
  const tOnboarding = useTranslations("Onboarding");

  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>{t("Dashboard.spending_by_category")}</CardTitle>
      </CardHeader>
      <CardContent>
        {spendingData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center space-y-4">
            <div className="rounded-full bg-muted p-4">
              <PieChart className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground max-w-[200px]">
              {t("Dashboard.no_expenses_recorded")}
            </p>
            <Button asChild>
              <Link href={`/${locale}/expenses`}>
                {tOnboarding("empty_expense_cta")}
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {spendingData.map((item, index) => (
              <div key={index} className="space-y-1.5 sm:space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span>{item.category?.icon || "💰"}</span>
                    <span className="font-medium">
                      {item.category
                        ? getCategoryName(item.category, t)
                        : "Uncategorized"}
                    </span>
                  </div>
                  <div className="text-muted-foreground">
                    {formatCurrency(item.amount)} ({Math.round(item.percentage)}
                    %)
                  </div>
                </div>
                <Progress
                  value={item.percentage}
                  className="h-2"
                  indicatorColor={item.category?.color || undefined}
                />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
