"use client";

import { useActionState, useEffect, useState } from "react";
import { createExpense, updateExpense, Expense } from "@/actions/expenses";
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
import { Category } from "@/lib/categories";
import { cn } from "@/lib/utils";
import { CalendarIcon, Loader2, Plus } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { getCategoryName } from "@/lib/utils";

interface ExpenseFormProps {
  categories: Category[]; // We can use the Tree structure to show groups?
  // For simplicity, maybe flattened list with indentation or just root/sub in select
  initialData?: Expense;
  onSuccess?: () => void;
}

export function ExpenseForm({
  categories,
  initialData,
  onSuccess,
}: ExpenseFormProps) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date>(
    initialData ? new Date(initialData.date) : new Date(),
  );
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const t = useTranslations();

  // Choose action based on mode
  const actionFn = initialData ? updateExpense : createExpense;
  const [state, action, isPending] = useActionState(actionFn, {});

  useEffect(() => {
    if (state.success) {
      const timeoutId = setTimeout(() => {
        setOpen(false);
        if (onSuccess) onSuccess();
      }, 0);
      toast.success(
        initialData
          ? t("Expenses.expense_updated")
          : t("Expenses.expense_created"),
      );
      return () => clearTimeout(timeoutId);
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state, initialData, onSuccess, t]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {initialData ? (
          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            {t("Expenses.edit")}
          </DropdownMenuItem>
        ) : (
          <Button>
            <Plus className="mr-2 h-4 w-4" /> {t("Expenses.add_expense")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {initialData
              ? t("Expenses.edit_expense")
              : t("Expenses.add_expense")}
          </DialogTitle>
          <DialogDescription>
            {initialData
              ? t("Expenses.update_transaction_details")
              : t("Expenses.log_new_transaction")}
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
                <SelectItem value="none">Uncategorized</SelectItem>
                {categories.map((cat) => (
                  <CategorySelectItems key={cat.id} category={cat} t={t} />
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">{t("Expenses.date")}</Label>
            <div className="col-span-3">
              <input type="hidden" name="date" value={date.toISOString()} />
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
              placeholder="Lunch, Gas, etc."
              className="col-span-3"
              defaultValue={initialData?.description || ""}
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {initialData
                ? t("Expenses.save_changes")
                : t("Expenses.create_expense")}
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
