"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Expense } from "@/actions/expenses";
import { Category } from "@/lib/categories";
import { ExpenseForm } from "@/components/expenses/expense-form";

import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteExpense } from "@/actions/expenses";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslations } from "next-intl";
import { getCategoryName } from "@/lib/utils";

export const useExpenseColumns = (
  categories: Category[],
): ColumnDef<Expense>[] => {
  const t = useTranslations();
  return [
    {
      accessorKey: "date",
      header: t("Expenses.date"),
      cell: ({ row }) => {
        const date = new Date(row.getValue("date"));
        return (
          <div className="text-muted-foreground">
            {date.toLocaleDateString()}
          </div>
        );
      },
    },
    {
      accessorKey: "category",
      header: t("Expenses.category"),
      cell: ({ row }) => {
        const category = row.original.category;
        if (!category)
          return <span className="text-muted-foreground">Uncategorized</span>;
        return (
          <div className="flex items-center gap-2">
            <span className="text-lg">{category.icon}</span>
            <span>{getCategoryName(category, t)}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "description",
      header: t("Expenses.table.description"),
      cell: ({ row }) => {
        return (
          <div className="max-w-[200px] truncate">
            {row.getValue("description") || "-"}
          </div>
        );
      },
    },
    {
      accessorKey: "amount",
      header: () => (
        <div className="text-right">{t("Expenses.table.amount")}</div>
      ),
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("amount"));
        const currency = row.original.currency;

        let formatted;
        if (currency === "USDT") {
          formatted = new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
          })
            .format(amount)
            .replace("$", "₮");
        } else {
          formatted = new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: currency,
          }).format(amount);
        }

        return <div className="text-right font-medium">{formatted}</div>;
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const expense = row.original;

        const handleDelete = async () => {
          try {
            await deleteExpense(expense.id);
            toast.success(t("Expenses.expense_deleted"));
          } catch (error) {
            toast.error(
              error instanceof Error
                ? error.message
                : t("Expenses.expense_deleted_error"),
            );
          }
        };

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">{t("Expenses.open_menu")}</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{t("Expenses.actions")}</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(expense.id)}
              >
                {t("Expenses.copy_id")}
              </DropdownMenuItem>
              {/* Edit Action - Prevents default to allow Dialog to open if we nested triggers, 
                 but ExpenseForm handles the Trigger itself. 
                 Wait, ExpenseForm has a DialogTrigger. putting a DialogTrigger inside DropdownMenuContent is slightly complex in shadcn/radix due to focus management.
                 Ideally: Selection of MenuItem opens the generic Dialog state controlled here.
            */}
              <ExpenseForm categories={categories} initialData={expense} />
              <DropdownMenuItem
                className="text-destructive"
                onClick={handleDelete}
              >
                {t("Expenses.delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
};
