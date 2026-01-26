"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Receipt,
  Wallet,
  Tags,
  TrendingUp,
  Settings,
} from "lucide-react";
import { useTranslations } from "next-intl";

const navigation = [
  { key: "dashboard", href: "/", icon: LayoutDashboard },
  { key: "expenses", href: "/expenses", icon: Receipt },
  { key: "budgets", href: "/budgets", icon: Wallet },
  { key: "categories", href: "/categories", icon: Tags },
  { key: "rates", href: "/rates", icon: TrendingUp },
  { key: "settings", href: "/settings", icon: Settings },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const t = useTranslations("Nav");

  return (
    <aside
      className={cn(
        "flex w-64 flex-col border-r border-border bg-card",
        className,
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-border px-6">
        <span className="text-lg font-semibold tracking-tight">Fin</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <item.icon className="h-4 w-4" />
              {t(item.key)}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
