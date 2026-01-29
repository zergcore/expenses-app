"use client";

import { useTranslations } from "next-intl";

interface PageTitleProps {
  title: string;
  description: string;
}

export const PageTitle = ({ title, description }: PageTitleProps) => {
  const t = useTranslations();
  return (
    <div className="space-y-1">
      <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
        {t(title)}
      </h1>
      <p className="text-sm text-muted-foreground/80">{t(description)}</p>
    </div>
  );
};
