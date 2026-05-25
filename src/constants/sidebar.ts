import {
  LayoutDashboard,
  Receipt,
  Wallet,
  Tags,
  TrendingUp,
  Settings,
  RefreshCw,
  Calculator,
} from "lucide-react";

export const navigation = [
  { key: "dashboard", href: "/dashboard", icon: LayoutDashboard },
  { key: "expenses", href: "/expenses", icon: Receipt },
  { key: "recurring", href: "/recurring", icon: RefreshCw },
  { key: "budgets", href: "/budgets", icon: Wallet },
  { key: "categories", href: "/categories", icon: Tags },
  { key: "rates", href: "/rates", icon: TrendingUp },
  { key: "calculator", href: "/dashboard/calculator", icon: Calculator },
  { key: "settings", href: "/settings", icon: Settings },
];
