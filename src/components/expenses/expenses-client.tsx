"use client";

import { DataTable } from "./data-table";
import { useExpenseColumns } from "./columns";
import { Category } from "@/lib/categories";
import { useExpenseChart } from "./expense-chart/expense-chart-context";

interface ExpensesClientProps {
  categories: Category[];
}

export function ExpensesClient({ categories }: ExpensesClientProps) {
  const columns = useExpenseColumns(categories);
  const { expenses, totalExpenses } = useExpenseChart();

  return (
    <DataTable
      columns={columns}
      data={expenses}
      totalAmount={totalExpenses}
      categories={categories}
    />
  );
}
