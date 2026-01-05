"use client";

import { useActionState, useEffect, useState } from "react";
import { createExpense } from "@/actions/expenses";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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

interface ExpenseFormProps {
  categories: Category[]; // We can use the Tree structure to show groups?
  // For simplicity, maybe flattened list with indentation or just root/sub in select
}

export function ExpenseForm({ categories }: ExpenseFormProps) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date>(new Date());

  const [state, action, isPending] = useActionState(createExpense, {});

  useEffect(() => {
    if (state.success) {
      // Defer state update to avoid sync render warning
      const t = setTimeout(() => setOpen(false), 0);
      toast.success("Expense created");
      return () => clearTimeout(t);
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state]);

  // Recursively flatten categories for the select?
  // Or just rely on flat list if passed.
  // The props pass "categories" which in Page will be the Tree or Flat?
  // Let's assume Page passes FLAT list for the form dropdown for simplicity.
  // Wait, Categories Page uses Tree. I should probably get a flat list for dropdowns.

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Add Expense
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Expense</DialogTitle>
          <DialogDescription>Log a new transaction.</DialogDescription>
        </DialogHeader>
        <form action={action} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount" className="text-right">
              Amount
            </Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              className="col-span-3"
              required
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="currency" className="text-right">
              Currency
            </Label>
            <Select name="currency" defaultValue="USD">
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD ($)</SelectItem>
                <SelectItem value="VES">VES (Bs.)</SelectItem>
                {/* Add USDT later */}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="category" className="text-right">
              Category
            </Label>
            <Select name="category_id">
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Uncategorized</SelectItem>
                {/* We need to render categories properly here */}
                {/* For now assuming flat list or handling tree rendering */}
                {categories.map((cat) => (
                  <CategorySelectItems key={cat.id} category={cat} />
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Date</Label>
            <div className="col-span-3">
              <input type="hidden" name="date" value={date.toISOString()} />
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => d && setDate(d)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Note
            </Label>
            <Input
              id="description"
              name="description"
              placeholder="Lunch, Gas, etc."
              className="col-span-3"
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save changes
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
}: {
  category: Category;
  level?: number;
}) {
  return (
    <>
      <SelectItem
        value={category.id}
        style={{ paddingLeft: `${level * 1 + 0.5}rem` }}
      >
        {category.icon} {category.name}
      </SelectItem>
      {category.subcategories?.map((sub) => (
        <CategorySelectItems key={sub.id} category={sub} level={level + 1} />
      ))}
    </>
  );
}
