"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { getAllExpensesForExport } from "@/actions/expenses";
import { toast } from "sonner";

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
        loading: "Generating export...",
        success: (data) => {
          if (data.length === 0) {
            return "No expenses to export for this period.";
          }

          // Convert to CSV
          const headers = [
            "Date",
            "Category",
            "Description",
            "Amount",
            "Currency",
            "Budget Amount",
            "Budget Currency",
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

          return "Export downloaded successfully!";
        },
        error: "Failed to export expenses.",
      });
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Something went wrong exporting expenses.");
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleExport}>
      <Download className="mr-2 h-4 w-4" />
      Export
    </Button>
  );
}
