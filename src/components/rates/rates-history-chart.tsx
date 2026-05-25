"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import {
  getMonthlyRateHistory,
  getDailyRateHistory,
  type RateHistoryPoint,
  type DailyRatePoint,
} from "@/actions/rates";

interface RatesHistoryChartProps {
  initialData: RateHistoryPoint[] | DailyRatePoint[];
  initialGranularity: "month" | "day";
  initialDate: string; // YYYY-MM-DD (used in daily mode)
}

export function RatesHistoryChart({
  initialData,
  initialGranularity,
  initialDate,
}: RatesHistoryChartProps) {
  const t = useTranslations("Rates");
  
  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [granularity, setGranularity] = useState(initialGranularity);
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [data, setData] = useState(initialData);
  const [isLoading, setIsLoading] = useState(false);

  // Generate last 12 months for the month selector
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    return { value, label };
  });

  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    let active = true;
    const fetchChartData = async () => {
      setIsLoading(true);
      try {
        if (granularity === "day") {
          const res = await getDailyRateHistory(selectedDate);
          if (active) setData(res);
        } else {
          const [y, m] = selectedMonth.split("-").map(Number);
          const res = await getMonthlyRateHistory(y, m);
          if (active) setData(res);
        }
      } catch (err) {
        console.error("Failed to load chart data:", err);
      } finally {
        if (active) setIsLoading(false);
      }
    };
    fetchChartData();

    return () => {
      active = false;
    };
  }, [granularity, selectedMonth, selectedDate]);

  const handleGranularityChange = (g: "month" | "day") => {
    setGranularity(g);
  };

  const handleMonthChange = (value: string) => {
    setSelectedMonth(value);
  };

  const handleDateSelect = (d: Date | undefined) => {
    if (!d) return;
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    setSelectedDate(dateStr);
    setCalendarOpen(false);
  };

  // Format date for display (monthly mode)
  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // Build chart data based on granularity
  const isDaily = granularity === "day";

  const safeData = data || [];

  const chartData = isDaily
    ? (safeData as DailyRatePoint[]).map((p) => ({ ...p, displayKey: p.time }))
    : (safeData as RateHistoryPoint[]).map((p) => ({
        ...p,
        displayKey: formatDate(p.date),
      }));

  const allRates = isDaily
    ? (safeData as DailyRatePoint[]).flatMap((d) => [d.usdt, d.usd, d.eur])
    : (safeData as RateHistoryPoint[]).flatMap((d) => [d.usd, d.usdt, d.eur]);

  const validRates = allRates.filter((v): v is number => v !== null);
  const minRate = validRates.length > 0 ? Math.min(...validRates) : 0;
  const maxRate = validRates.length > 0 ? Math.max(...validRates) : 100;
  const padding = (maxRate - minRate) * 0.1 || 1;

  // Parse selectedDate for the calendar
  const [sy, sm, sd] = selectedDate.split("-").map(Number);
  const calendarDate = new Date(sy, sm - 1, sd);

  const isEmpty = validRates.length === 0;

  return (
    <Card className="w-full">
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0 flex-wrap gap-2">
        <CardTitle className="text-lg font-semibold">
          {isDaily ? t("daily_trend") : t("monthly_trend")}
        </CardTitle>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Granularity toggle */}
          <div className="flex rounded-md border overflow-hidden text-sm">
            <button
              onClick={() => handleGranularityChange("month")}
              className={cn(
                "px-3 py-1.5 transition-colors",
                !isDaily
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted",
              )}
            >
              {t("granularity_monthly")}
            </button>
            <button
              onClick={() => handleGranularityChange("day")}
              className={cn(
                "px-3 py-1.5 transition-colors border-l",
                isDaily
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted",
              )}
            >
              {t("granularity_daily")}
            </button>
          </div>

          {/* Month selector (monthly mode) */}
          {!isDaily && (
            <Select value={selectedMonth} onValueChange={handleMonthChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                {months.map((month) => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Date picker (daily mode) */}
          {isDaily && (
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[180px] justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate
                    ? format(calendarDate, "PPP")
                    : t("pick_date")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={calendarDate}
                  onSelect={handleDateSelect}
                  disabled={(d) => d > now}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          )}
        </div>
      </CardHeader>

      <CardContent className="pb-4 relative">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-[1px]">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
        {isEmpty ? (
          <p className="h-[300px] flex items-center justify-center text-sm text-muted-foreground">
            {t("no_data_for_date")}
          </p>
        ) : (
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-muted"
                  opacity={0.3}
                />
                <XAxis
                  dataKey="displayKey"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  className="text-muted-foreground"
                  interval="preserveStartEnd"
                />
                <YAxis
                  domain={[minRate - padding, maxRate + padding]}
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `Bs.${value.toFixed(0)}`}
                  className="text-muted-foreground"
                  width={60}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  labelStyle={{ fontWeight: "bold", marginBottom: "4px" }}
                  formatter={(value: number) => [`Bs. ${value.toFixed(2)}`, ""]}
                />
                <Legend
                  wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }}
                />
                <Line
                  type="monotone"
                  dataKey="usd"
                  name={t("usd_official")}
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={isDaily ? false : { r: 3 }}
                  activeDot={{ r: 5 }}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="usdt"
                  name={t("usdt_binance")}
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={isDaily ? false : { r: 3 }}
                  activeDot={{ r: 5 }}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="eur"
                  name={t("eur_bcv")}
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={isDaily ? false : { r: 3 }}
                  activeDot={{ r: 5 }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
