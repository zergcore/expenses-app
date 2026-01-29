"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { getAllExpensesForExport } from "@/actions/expenses";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

export function ExportExpensesButton() {
  const searchParams = useSearchParams();
  const month = searchParams.get("month")
    ? parseInt(searchParams.get("month")!)
    : undefined;
  const year = searchParams.get("year")
    ? parseInt(searchParams.get("year")!)
    : undefined;

  const handleExport = async () => {
    try {
      const promise = getAllExpensesForExport(month, year);

      toast.promise(promise, {
        loading: t("generating_export"),
        success: (data) => {
          if (data.length === 0) {
            return t("no_expenses_to_export");
          }

          // Convert to CSV
          const headers = [
            t("date"),
            t("category"),
            t("description"),
            t("amount"),
            t("currency"),
            t("budget_amount"),
            t("budget_currency"),
          ];
          const csvContent = [
            headers.join(","),
            ...data.map((row) =>
              [
                row.date,
                `"${row.category}"`, // Quote strings that might have commas
                `"${row.description}"`,
                row.amount,
                row.currency,
                row.budget_amount,
                row.budget_currency,
              ].join(","),
            ),
          ].join("\n");

          // Create blob and download
          const blob = new Blob([csvContent], {
            type: "text/csv;charset=utf-8;",
          });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.setAttribute("href", url);
          link.setAttribute(
            "download",
            `expenses_export_${year || new Date().getFullYear()}_${
              (month || new Date().getMonth()) + 1
            }.csv`,
          );
          link.style.visibility = "hidden";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          return t("export_downloaded_successfully");
        },
        error: t("failed_to_export_expenses"),
      });
    } catch (error) {
      console.error(t("export_error"), error);
      toast.error(t("something_went_wrong_exporting_expenses"));
    }
  };

  const t = useTranslations("Expenses");

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      className="bg-card/50 border-border/50 hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-colors"
    >
      <Download className="mr-2 h-4 w-4" />
      {t("export")}
    </Button>
  );
}
