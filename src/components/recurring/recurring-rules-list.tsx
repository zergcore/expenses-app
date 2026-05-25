"use client";

import { useState } from "react";
import {
  RecurringRule,
  deleteRecurringRule,
  toggleRecurringRule,
  processRuleNow,
} from "@/actions/recurring";
import { RecurringRuleForm } from "./recurring-rule-form";
import { Category } from "@/lib/categories";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  MoreHorizontal,
  RefreshCw,
  Play,
  Trash2,
  CalendarDays,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { getCategoryName } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface RecurringRulesListProps {
  rules: RecurringRule[];
  categories: Category[];
}

export function RecurringRulesList({
  rules,
  categories,
}: RecurringRulesListProps) {
  const t = useTranslations();

  if (rules.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <RefreshCw className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {t("Recurring.no_recurring_rules")}
          </h3>
          <p className="text-muted-foreground text-center mb-4 max-w-md">
            {t("Recurring.no_recurring_rules_description")}
          </p>
          <RecurringRuleForm categories={categories} />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {rules.map((rule) => (
        <RecurringRuleCard key={rule.id} rule={rule} categories={categories} />
      ))}
    </div>
  );
}

function RecurringRuleCard({
  rule,
  categories,
}: {
  rule: RecurringRule;
  categories: Category[];
}) {
  const t = useTranslations();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const handleToggle = async (checked: boolean) => {
    setIsToggling(true);
    const result = await toggleRecurringRule(rule.id, checked);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(
        checked ? t("Recurring.rule_enabled") : t("Recurring.rule_disabled"),
      );
    }
    setIsToggling(false);
  };

  const handleProcessNow = async () => {
    setIsProcessing(true);
    const result = await processRuleNow(rule.id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(t("Recurring.expense_generated"));
    }
    setIsProcessing(false);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await deleteRecurringRule(rule.id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(t("Recurring.rule_deleted"));
    }
    setIsDeleting(false);
  };

  const frequencyLabel = t(`Recurring.${rule.frequency}`);
  const categoryDisplay = rule.category
    ? `${rule.category.icon || ""} ${getCategoryName({ ...rule.category, is_default: false }, t)}`.trim()
    : t("Categories.uncategorized");

  const currencySymbols: Record<string, string> = {
    USD: "$",
    VES: "Bs.",
    USDT: "₮",
    EUR: "€",
  };

  return (
    <Card className={cn(!rule.is_active && "opacity-60")}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="text-2xl font-bold">
                {currencySymbols[rule.currency] || ""}
                {rule.amount.toFixed(2)}
              </span>
              <span className="text-sm font-normal text-muted-foreground">
                {rule.currency}
              </span>
            </CardTitle>
            <CardDescription className="flex items-center gap-2">
              <RefreshCw className="h-3 w-3" />
              {frequencyLabel}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={rule.is_active}
              onCheckedChange={handleToggle}
              disabled={isToggling}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <RecurringRuleForm categories={categories} initialData={rule} />
                <DropdownMenuItem
                  onClick={handleProcessNow}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="mr-2 h-4 w-4" />
                  )}
                  {t("Recurring.generate_now")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onSelect={(e) => e.preventDefault()}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {t("Common.delete")}
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        {t("Recurring.delete_rule_title")}
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        {t("Recurring.delete_rule_description")}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>
                        {t("Common.cancel")}
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        disabled={isDeleting}
                      >
                        {isDeleting && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        {t("Common.delete")}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center text-sm text-muted-foreground">
          <span className="font-medium">{categoryDisplay}</span>
        </div>
        {rule.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {rule.description}
          </p>
        )}
        <div className="flex items-center gap-1 text-xs text-muted-foreground pt-2 border-t">
          <CalendarDays className="h-3 w-3" />
          <span>
            {t("Recurring.next_due")}:{" "}
            {format(new Date(rule.next_due_date), "PP")}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
