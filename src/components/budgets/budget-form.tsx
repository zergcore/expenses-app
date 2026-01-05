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
    initialState
  );

  useEffect(() => {
    if (state.success) {
      const t = setTimeout(() => setOpen(false), 0);
      toast.success("Budget created successfully");
      return () => clearTimeout(t);
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Create Budget
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Budget</DialogTitle>
          <DialogDescription>
            Set a monthly spending limit for a category.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                Category
              </Label>
              <Select name="category_id">
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Global (All Expenses)</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                Limit
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
              {isPending ? "Creating..." : "Create Budget"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
