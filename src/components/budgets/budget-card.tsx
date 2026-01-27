import { Budget } from "@/actions/budgets";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/utils";
import { AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";

interface BudgetCardProps {
  budget: Budget;
}

export function BudgetCard({ budget }: BudgetCardProps) {
  const isOverBudget = budget.spent > budget.amount;
  const isHighAlert = budget.progress >= 90;

  // Determine color based on progress
  let progressColor = "bg-primary";
  if (isOverBudget) progressColor = "bg-destructive";
  else if (isHighAlert) progressColor = "bg-yellow-500";

  const t = useTranslations();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <span>{budget.category?.icon || "💰"}</span>
          <span>{budget.category?.name || t("Budgets.global_budget")}</span>
        </CardTitle>
        {isHighAlert && <AlertCircle className="h-4 w-4 text-destructive" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {formatCurrency(budget.amount, budget.currency || "USD")}
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          {isOverBudget ? t("Budgets.over_by") : t("Budgets.left")}
          {formatCurrency(
            Math.abs(budget.amount - budget.spent),
            budget.currency || "USD",
          )}
        </p>

        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span>
              {Math.round(budget.progress)}% {t("Budgets.used")}
            </span>
            <span>
              {formatCurrency(budget.spent, budget.currency || "USD")}
            </span>
          </div>
          <Progress
            value={budget.progress}
            indicatorClassName={progressColor}
          />
        </div>
      </CardContent>
    </Card>
  );
}
