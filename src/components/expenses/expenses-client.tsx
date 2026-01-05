"use client";

import { useMemo } from "react";
import { DataTable } from "./data-table";
import { getColumns } from "./columns";
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
  const columns = useMemo(() => getColumns(categories), [categories]);

  return (
    <DataTable columns={columns} data={expenses} totalAmount={totalAmount} />
  );
}
