"use client";

import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface CategoryProgress {
  id: string;
  name: string;
  icon: string;
  color: string;
  spent: number;
  budget: number;
  percentage: number;
}

interface CategoryProgressBarsProps {
  categories: CategoryProgress[];
  currency: string;
}

export const CategoryProgressBars = ({
  categories,
  currency,
}: CategoryProgressBarsProps) => {
  const t = useTranslations();

  if (!categories || categories.length === 0) return null;

  // Take top 3 categories by spending
  const topCategories = [...categories]
    .sort((a, b) => b.spent - a.spent)
    .slice(0, 3);

  return (
    <div className="px-3 sm:px-4 py-3 border-t space-y-3">
      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {t("Expenses.top_categories")}
      </h4>
      {topCategories.map((category) => {
        const isOverBudget = category.percentage > 100;
        return (
          <div key={category.id} className="space-y-1">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <div className="flex items-center gap-2">
                <span
                  className="flex items-center justify-center w-6 h-6 rounded-full text-sm"
                  style={{ backgroundColor: `${category.color}20` }}
                >
                  {category.icon}
                </span>
                <span className="font-medium">{category.name}</span>
              </div>
              <div className="text-right">
                <span
                  className={
                    isOverBudget
                      ? "text-orange-500 font-semibold"
                      : "text-foreground"
                  }
                >
                  {formatCurrency(category.spent, currency)}
                </span>
                <span className="text-muted-foreground">
                  {" "}
                  / {formatCurrency(category.budget, currency)}
                </span>
              </div>
            </div>
            <Progress
              value={Math.min(category.percentage, 100)}
              className="h-1.5"
              style={{
                // @ts-expect-error Custom CSS property
                "--progress-background": isOverBudget
                  ? "rgb(249, 115, 22)"
                  : category.color,
              }}
            />
          </div>
        );
      })}
    </div>
  );
};
