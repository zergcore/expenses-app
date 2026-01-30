import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatCurrency, getCategoryName } from "@/lib/utils";
import { getSpendingByCategory } from "@/actions/expenses";
import { getTranslations } from "next-intl/server";

export async function SpendingByCategory() {
  const t = await getTranslations();
  const spendingByCategory = await getSpendingByCategory();
  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>{t("Dashboard.spending_by_category")}</CardTitle>
      </CardHeader>
      <CardContent>
        {spendingByCategory.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("Dashboard.no_expenses_recorded")}
          </p>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {spendingByCategory.map((item, index) => (
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
