"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
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
    <div className="inline-flex items-center gap-0.5 bg-secondary/30 rounded-full border border-border/40 p-0.5">
      <Button
        variant="ghost"
        size="icon"
        onClick={handlePrev}
        className="h-8 w-8 rounded-full hover:bg-background/80 transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <div className="flex items-center gap-1.5 px-2">
        <Calendar className="h-3.5 w-3.5 text-primary" />
        <span className="font-medium text-sm min-w-[100px] text-center">
          {capitalizedDate}
        </span>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleNext}
        className="h-8 w-8 rounded-full hover:bg-background/80 transition-colors"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
