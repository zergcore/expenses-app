"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { format, subMonths, addMonths } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { useParams } from "next/navigation";

export function MonthSelector() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const locale = params.locale === "es" ? es : enUS;

  // Initialize from URL or default to current date
  const [currentDate, setCurrentDate] = useState(() => {
    const month = searchParams.get("month");
    const year = searchParams.get("year");
    if (month && year) {
      return new Date(parseInt(year), parseInt(month), 1);
    }
    return new Date();
  });

  const handlePrev = () => {
    const newDate = subMonths(currentDate, 1);
    updateUrl(newDate);
  };

  const handleNext = () => {
    const newDate = addMonths(currentDate, 1);
    updateUrl(newDate);
  };

  const updateUrl = (date: Date) => {
    setCurrentDate(date);
    const params = new URLSearchParams(searchParams);
    params.set("month", date.getMonth().toString());
    params.set("year", date.getFullYear().toString());
    router.push(`?${params.toString()}`);
  };

  const formattedDate = format(currentDate, "MMMM yyyy", { locale });
  const capitalizedDate =
    formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  return (
    <div className="flex items-center gap-4 bg-secondary/20 p-2 rounded-lg border">
      <Button variant="ghost" size="icon" onClick={handlePrev}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <div className="min-w-[120px] text-center font-semibold text-sm capitalize">
        {capitalizedDate}
      </div>
      <Button variant="ghost" size="icon" onClick={handleNext}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
