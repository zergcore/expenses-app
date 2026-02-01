"use client";

import { useSyncExternalStore } from "react";
import { ExpenseForm } from "@/components/expenses/expense-form";
import { ReceiptScanner } from "@/components/receipts/receipt-scanner";
import type { Category } from "@/lib/categories";

// Subscribe function that never triggers updates
const emptySubscribe = () => () => {};
// Returns true on client, false on server
const getSnapshot = () => true;
const getServerSnapshot = () => false;

interface ExpenseActionsProps {
  categories: Category[];
}

/**
 * Client-only wrapper for expense action buttons (ExpenseForm, ReceiptScanner)
 * Prevents hydration mismatch from Radix UI's auto-generated aria IDs
 */
export function ExpenseActions({ categories }: ExpenseActionsProps) {
  const isClient = useSyncExternalStore(
    emptySubscribe,
    getSnapshot,
    getServerSnapshot,
  );

  if (!isClient) {
    return null;
  }

  return (
    <>
      <ReceiptScanner categories={categories} />
      <ExpenseForm categories={categories} />
    </>
  );
}
