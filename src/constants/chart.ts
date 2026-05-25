import { ChartConfig } from "@/components/ui/chart";

export const COLORS = {
  spent: "#f97316", // Orange for budgeted spending
  remaining: "#22c55e", // Green for remaining budget
  over: "#ef4444", // Red for over budget
  unbudgeted: "#8b5cf6", // Purple for unbudgeted expenses
};

export const chartConfig: ChartConfig = {
  value: {
    label: "Amount",
  },
  spent: {
    label: "Budgeted Spent",
    color: COLORS.spent,
  },
  remaining: {
    label: "Remaining",
    color: COLORS.remaining,
  },
  over: {
    label: "Over Budget",
    color: COLORS.over,
  },
  unbudgeted: {
    label: "Unbudgeted",
    color: COLORS.unbudgeted,
  },
};
