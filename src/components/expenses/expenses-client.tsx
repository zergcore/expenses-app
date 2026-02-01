"use client";

import { DataTable } from "./data-table";
import { useExpenseColumns } from "./columns";
import { Category } from "@/lib/categories";
import { useExpenseChart } from "./expense-chart/expense-chart-context";
import { useSyncExternalStore } from "react";

// Subscribe function that never triggers updates (client is always mounted after hydration)
const emptySubscribe = () => () => {};
// Returns true on client, false on server
const getSnapshot = () => true;
const getServerSnapshot = () => false;

interface ExpensesClientProps {
  categories: Category[];
}

export function ExpensesClient({ categories }: ExpensesClientProps) {
  const columns = useExpenseColumns(categories);
  const { expenses, totalExpenses } = useExpenseChart();

  // Detect if we're on the client to prevent hydration mismatch
  // from Radix UI's auto-generated IDs in Dialog/DropdownMenu
  const isClient = useSyncExternalStore(
    emptySubscribe,
    getSnapshot,
    getServerSnapshot,
  );

  if (!isClient) {
    return null; // Return null during SSR to avoid hydration mismatch
  }

  return (
    <DataTable
      columns={columns}
      data={expenses}
      totalAmount={totalExpenses}
      categories={categories}
    />
  );
}
