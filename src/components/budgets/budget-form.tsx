"use client";

import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createBudget, ActionState } from "@/actions/budgets";
import { Category } from "@/lib/categories";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

const initialState: ActionState = {
  error: "",
};

interface BudgetFormProps {
  categories: Category[];
}

export function BudgetForm({ categories }: BudgetFormProps) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(
    createBudget,
    initialState,
  );
  const t = useTranslations();

  useEffect(() => {
    if (state.success) {
      const timeoutId = setTimeout(() => setOpen(false), 0);
      toast.success(t("budgets.budget_created_successfully"));
      return () => clearTimeout(timeoutId);
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state, t]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          {t("budgets.create_budget")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("budgets.create_budget")}</DialogTitle>
          <DialogDescription>
            {t("budgets.create_budget_description")}
          </DialogDescription>
        </DialogHeader>
        <form action={formAction}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                {t("budgets.category")}
              </Label>
              <Select name="category_id">
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder={t("budgets.select_category")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("budgets.global")}</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="currency" className="text-right">
                {t("budgets.currency")}
              </Label>
              <Select name="currency" defaultValue="USD">
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="VES">VES (Bs.)</SelectItem>
                  <SelectItem value="USDT">Tether (USDT)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                {t("budgets.limit")}
              </Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                placeholder="500.00"
                className="col-span-3"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? t("budgets.creating") : t("budgets.create_budget")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
