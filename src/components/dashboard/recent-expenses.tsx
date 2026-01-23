import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { getTranslations } from "next-intl/server";
import { formatCurrency } from "@/lib/utils";
import { getExpenses } from "@/actions/expenses";

export const RecentExpenses = async () => {
  const t = await getTranslations("Dashboard");
  const recentExpenses = (await getExpenses(1, 5))?.data;
  return (
    <Card className="md:col-span-1">
      <CardHeader>
        <CardTitle>{t("recentExpenses")}</CardTitle>
      </CardHeader>
      <CardContent>
        {recentExpenses?.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noExpenses")}</p>
        ) : (
          <div className="space-y-4">
            {recentExpenses?.map((expense) => (
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
  );
};
