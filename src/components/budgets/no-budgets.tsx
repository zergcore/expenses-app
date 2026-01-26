"use client";

import { useTranslations } from "next-intl";

export const NoBudgets = () => {
  const t = useTranslations();
  return (
    <div className="col-span-full flex h-40 items-center justify-center rounded-lg border border-dashed">
      <p className="text-muted-foreground">{t("Budgets.noBudgetsSet")}</p>
    </div>
  );
};
