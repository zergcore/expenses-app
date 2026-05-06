"use client";

import { useActionState, useEffect, useState } from "react";
import {
  createRecurringRule,
  updateRecurringRule,
  RecurringRule,
} from "@/actions/recurring";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Category } from "@/lib/categories";
import { cn } from "@/lib/utils";
import { CalendarIcon, Loader2, Plus, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { getCategoryName } from "@/lib/utils";

interface RecurringRuleFormProps {
  categories: Category[];
  initialData?: RecurringRule;
  onSuccess?: () => void;
  triggerButton?: React.ReactNode;
}

export function RecurringRuleForm({
  categories,
  initialData,
  onSuccess,
  triggerButton,
}: RecurringRuleFormProps) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date>(
    initialData ? new Date(initialData.next_due_date) : new Date(),
  );
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [generateNow, setGenerateNow] = useState(false);
  const t = useTranslations();

  // Choose action based on mode
  const actionFn = initialData ? updateRecurringRule : createRecurringRule;
  const [state, action, isPending] = useActionState(actionFn, {});

  useEffect(() => {
    if (state.success) {
      const timeoutId = setTimeout(() => {
        setOpen(false);
        setGenerateNow(false);
        if (onSuccess) onSuccess();
      }, 0);
      toast.success(
        initialData ? t("Recurring.rule_updated") : t("Recurring.rule_created"),
      );
      return () => clearTimeout(timeoutId);
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state, initialData, onSuccess, t]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton ? (
          triggerButton
        ) : initialData ? (
          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            {t("Common.edit")}
          </DropdownMenuItem>
        ) : (
          <Button>
            <Plus className="mr-2 h-4 w-4" /> {t("Recurring.add_recurring")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            {initialData
              ? t("Recurring.edit_recurring")
              : t("Recurring.add_recurring")}
          </DialogTitle>
          <DialogDescription>
            {initialData
              ? t("Recurring.update_recurring_details")
              : t("Recurring.setup_recurring_expense")}
          </DialogDescription>
        </DialogHeader>
        <form action={action} className="grid gap-4 py-4">
          {initialData && (
            <input type="hidden" name="id" value={initialData.id} />
          )}

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount" className="text-right">
              {t("Expenses.amount")}
            </Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              className="col-span-3"
              defaultValue={initialData?.amount}
              required
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="currency" className="text-right">
              {t("Expenses.currency")}
            </Label>
            <Select
              name="currency"
              defaultValue={initialData?.currency || "USD"}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD ($)</SelectItem>
                <SelectItem value="VES">VES (Bs.)</SelectItem>
                <SelectItem value="USDT">Tether (USDT)</SelectItem>
                <SelectItem value="EUR">EUR (€)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="category" className="text-right">
              {t("Expenses.category")}
            </Label>
            <Select
              name="category_id"
              defaultValue={initialData?.category_id || "none"}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  {t("Categories.uncategorized")}
                </SelectItem>
                {categories.map((cat) => (
                  <CategorySelectItems key={cat.id} category={cat} t={t} />
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="frequency" className="text-right">
              {t("Recurring.frequency")}
            </Label>
            <Select
              name="frequency"
              defaultValue={initialData?.frequency || "monthly"}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">{t("Recurring.daily")}</SelectItem>
                <SelectItem value="weekly">{t("Recurring.weekly")}</SelectItem>
                <SelectItem value="monthly">
                  {t("Recurring.monthly")}
                </SelectItem>
                <SelectItem value="yearly">{t("Recurring.yearly")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">{t("Recurring.start_date")}</Label>
            <div className="col-span-3">
              <input
                type="hidden"
                name="next_due_date"
                value={date.toISOString().split("T")[0]}
              />
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? (
                      format(date, "PPP")
                    ) : (
                      <span>{t("Expenses.pick_a_date")}</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => {
                      if (d) {
                        setDate(d);
                        setIsCalendarOpen(false);
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              {t("Expenses.note")}
            </Label>
            <Input
              id="description"
              name="description"
              placeholder={t("Recurring.description_placeholder")}
              className="col-span-3"
              defaultValue={initialData?.description || ""}
            />
          </div>

          {/* Generate Now checkbox - only for new rules */}
          {!initialData && (
            <div className="grid grid-cols-4 items-center gap-4">
              <div className="col-span-1" />
              <div className="col-span-3 flex items-center space-x-2">
                <input
                  type="hidden"
                  name="generate_now"
                  value={generateNow ? "true" : "false"}
                />
                <Checkbox
                  id="generate_now"
                  checked={generateNow}
                  onCheckedChange={(checked) =>
                    setGenerateNow(checked === true)
                  }
                />
                <Label
                  htmlFor="generate_now"
                  className="text-sm font-normal cursor-pointer"
                >
                  {t("Recurring.generate_first_expense_now")}
                </Label>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {initialData
                ? t("Common.save_changes")
                : t("Recurring.create_rule")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CategorySelectItems({
  category,
  level = 0,
  t,
}: {
  category: Category;
  level?: number;
  t: (key: string) => string;
}) {
  return (
    <>
      <SelectItem
        value={category.id}
        style={{ paddingLeft: `${level * 1 + 0.5}rem` }}
      >
        {category.icon} {getCategoryName(category, t)}
      </SelectItem>
      {category.subcategories?.map((sub) => (
        <CategorySelectItems
          key={sub.id}
          category={sub}
          level={level + 1}
          t={t}
        />
      ))}
    </>
  );
}
