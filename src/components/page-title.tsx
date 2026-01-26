"use client";

import { useTranslations } from "next-intl";

interface PageTitleProps {
  title: string;
  description: string;
}

export const PageTitle = ({ title, description }: PageTitleProps) => {
  const t = useTranslations();
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">{t(title)}</h1>
      <p className="text-muted-foreground">{t(description)}</p>
    </div>
  );
};
