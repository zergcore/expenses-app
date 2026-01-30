"use client";

import { Expense } from "@/actions/expenses";
import { createClient } from "@/lib/supabase/client";
import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
  useRef,
} from "react";

interface ExpenseChartContextType {
  // Input props
  totalBudget: number;
  budgetSpent: number;
  totalExpenses: number;
  currency: string;
  expenses: Expense[];

  // Derived values
  remaining: number;
  isOverBudget: boolean;
  overBudget: number;
  unbudgetedAmount: number;
  percentage: number;
  // Daily spending insights
  dailyAverageSpent: number;
  dailyBudgetTarget: number;
  daysRemaining: number;
  daysElapsed: number;
  projectedSpending: number;
}

const ExpenseChartContext = createContext<ExpenseChartContextType | null>(null);

interface ExpenseChartProviderProps {
  children: ReactNode;
  totalBudget: number;
  budgetSpent: number;
  totalExpenses: number;
  currency: string;
  initialExpenses: Expense[];
  budgetedCategoryIds: string[];
  hasGlobalBudget: boolean;
}

export function ExpenseChartProvider({
  children,
  totalBudget: initialTotalBudget,
  budgetSpent: initialBudgetSpent,
  totalExpenses: initialTotalExpenses,
  currency,
  initialExpenses,
  budgetedCategoryIds,
  hasGlobalBudget,
}: ExpenseChartProviderProps) {
  const [totalBudget] = useState(initialTotalBudget); // Budget config usually static per session unless realtime too
  const [budgetSpent, setBudgetSpent] = useState(initialBudgetSpent);
  const [totalExpenses, setTotalExpenses] = useState(initialTotalExpenses);
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);

  // Sync with props if they change (e.g. server re-render on navigation)
  useEffect(() => {
    setBudgetSpent(initialBudgetSpent);
  }, [initialBudgetSpent]);

  useEffect(() => {
    setTotalExpenses(initialTotalExpenses);
  }, [initialTotalExpenses]);

  useEffect(() => {
    setExpenses(initialExpenses);
  }, [initialExpenses]);

  // Effect to re-calc totals whenever 'expenses' changes?
  // This is safer than incremental updates!
  // If 'expenses' contains ALL expenses, we can just sum them up.
  // BUT 'expenses' might be paginated! The server passes 'expenses' (page 1).
  // 'initialTotalExpenses' is the total of ALL pages.
  // If we only have Page 1 in state, re-summing suggests we only have Page 1 total.
  // We want the GLOBAL total.

  // So incremental updates are necessary.

  // SOLVING THE 'DELETE' PROBLEM:
  // We can use a ref `currentExpensesRef` that is updated every render.

  const expensesRef = useRef(expenses);
  useEffect(() => {
    expensesRef.current = expenses;
  }, [expenses]);

  // Re-implementing Subscription with Ref access
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("realtime-expenses-v2")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "expenses" },
        (payload: RealtimePostgresChangesPayload<Expense>) => {
          // Handle INSERT
          if (payload.eventType === "INSERT") {
            const newExp = payload.new as Expense;
            setExpenses((prev) => [newExp, ...prev]);
            setTotalExpenses((prev) => prev + newExp.amount);

            // Check if this expense affects budgets
            if (
              hasGlobalBudget ||
              (newExp.category_id &&
                budgetedCategoryIds.includes(newExp.category_id))
            ) {
              setBudgetSpent((prev) => prev + newExp.amount);
            }
          }

          // Handle DELETE
          if (payload.eventType === "DELETE") {
            const id = payload.old.id; // Correct access for DELETE usually
            // Note: payload.old might handle partial depending on RLS. Assuming we have ID.

            const target = expensesRef.current.find((e) => e.id === id);
            if (target) {
              setTotalExpenses((prev) => prev - target.amount);
              if (
                hasGlobalBudget ||
                (target.category_id &&
                  budgetedCategoryIds.includes(target.category_id))
              ) {
                setBudgetSpent((prev) => prev - target.amount);
              }
              setExpenses((prev) => prev.filter((e) => e.id !== id));
            }
          }

          // Handle UPDATE
          if (payload.eventType === "UPDATE") {
            const newExp = payload.new as Expense;
            const target = expensesRef.current.find((e) => e.id === newExp.id);
            if (target) {
              const amountDiff = newExp.amount - target.amount;
              setTotalExpenses((prev) => prev + amountDiff);

              // Budget logic simplified: assumes category didn't change for now or handles it roughly
              // To be precise: check if Old match budget vs New match budget
              const oldMatch =
                hasGlobalBudget ||
                (target.category_id &&
                  budgetedCategoryIds.includes(target.category_id));
              const newMatch =
                hasGlobalBudget ||
                (newExp.category_id &&
                  budgetedCategoryIds.includes(newExp.category_id));

              if (oldMatch && newMatch) {
                setBudgetSpent((prev) => prev + amountDiff);
              } else if (oldMatch && !newMatch) {
                setBudgetSpent((prev) => prev - target.amount);
              } else if (!oldMatch && newMatch) {
                setBudgetSpent((prev) => prev + newExp.amount);
              }

              setExpenses((prev) =>
                prev.map((e) => (e.id === newExp.id ? { ...e, ...newExp } : e)),
              );
            }
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [budgetedCategoryIds, hasGlobalBudget]);

  const remaining = Math.max(totalBudget - budgetSpent, 0);
  const isOverBudget = budgetSpent > totalBudget;
  const overBudget = isOverBudget ? budgetSpent - totalBudget : 0;
  const unbudgetedAmount = Math.max(totalExpenses - budgetSpent, 0);
  const percentage =
    totalBudget > 0 ? Math.round((budgetSpent / totalBudget) * 100) : 0;

  // Daily spending insights
  const now = new Date();
  const daysElapsed = now.getDate();
  const daysInMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
  ).getDate();
  const daysRemaining = daysInMonth - daysElapsed;
  const dailyAverageSpent = daysElapsed > 0 ? totalExpenses / daysElapsed : 0;
  const dailyBudgetTarget =
    daysRemaining > 0 ? (totalBudget - budgetSpent) / daysRemaining : 0;

  // Projected end-of-month spending: P = (A × D) + S
  // Where A = daily average, D = remaining days, S = current total spent
  const projectedSpending = dailyAverageSpent * daysRemaining + totalExpenses;

  const value = {
    totalBudget,
    budgetSpent,
    totalExpenses,
    currency,
    expenses,
    remaining,
    isOverBudget,
    overBudget,
    unbudgetedAmount,
    percentage,
    dailyAverageSpent,
    dailyBudgetTarget,
    daysRemaining,
    daysElapsed,
    projectedSpending,
  };

  return (
    <ExpenseChartContext.Provider value={value}>
      {children}
    </ExpenseChartContext.Provider>
  );
}

export function useExpenseChart() {
  const context = useContext(ExpenseChartContext);
  if (!context) {
    throw new Error(
      "useExpenseChart must be used within an ExpenseChartProvider",
    );
  }
  return context;
}
