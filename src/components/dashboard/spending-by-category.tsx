import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/utils";
import { getSpendingByCategory } from "@/actions/expenses";

export async function SpendingByCategory() {
  const spendingByCategory = await getSpendingByCategory();
  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>Spending by Category</CardTitle>
      </CardHeader>
      <CardContent>
        {spendingByCategory.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No expenses recorded for this period.
          </p>
        ) : (
          <div className="space-y-4">
            {spendingByCategory.map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span>{item.category?.icon || "💰"}</span>
                    <span className="font-medium">
                      {item.category?.name || "Uncategorized"}
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
