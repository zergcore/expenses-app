"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PiggyBank } from "lucide-react";

interface NoBudgetsProps {
  locale: string;
}

export const NoBudgets = ({ locale }: NoBudgetsProps) => {
  const tOnboarding = useTranslations("Onboarding");

  return (
    <div className="col-span-full flex flex-col h-48 items-center justify-center rounded-lg border border-dashed space-y-4">
      <div className="rounded-full bg-muted p-4">
        <PiggyBank className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="text-muted-foreground text-center max-w-[250px]">
        {tOnboarding("empty_budget_cta")}
      </p>
      <Button asChild>
        <Link href={`/${locale}/budgets`}>{tOnboarding("create_budget")}</Link>
      </Button>
    </div>
  );
};
