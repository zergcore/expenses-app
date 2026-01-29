"use client";

import { DataTable } from "./data-table";
import { useExpenseColumns } from "./columns";
import { Expense } from "@/actions/expenses";
import { Category } from "@/lib/categories";

interface ExpensesClientProps {
  expenses: Expense[];
  categories: Category[];
  totalAmount: number;
}

export function ExpensesClient({
  expenses,
  categories,
  totalAmount,
}: ExpensesClientProps) {
  const columns = useExpenseColumns(categories);

  return (
    <DataTable
      columns={columns}
      data={expenses}
      totalAmount={totalAmount}
      categories={categories}
    />
  );
}
