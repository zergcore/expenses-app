"use client";

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
import type { RateHistoryPoint } from "@/actions/rates";

interface PublicRatesHistoryChartProps {
  data: RateHistoryPoint[];
}

export function PublicRatesHistoryChart({ data }: PublicRatesHistoryChartProps) {
  const t = useTranslations("Landing.history");
  const tRates = useTranslations("Rates");

  const hasData = data.some((d) => d.usd !== null || d.usdt !== null || d.eur !== null);

  if (!hasData) {
    return (
      <p className="text-sm text-muted-foreground text-center py-12">
        {t("no_data")}
      </p>
    );
  }

  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const chartData = data.map((point) => ({
    ...point,
    displayDate: formatDate(point.date),
  }));

  const validRates = data
    .flatMap((d) => [d.usd, d.usdt, d.eur])
    .filter((v): v is number => v !== null);

  const minRate = validRates.length > 0 ? Math.min(...validRates) : 0;
  const maxRate = validRates.length > 0 ? Math.max(...validRates) : 100;
  const padding = (maxRate - minRate) * 0.1 || 1;

  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis
            dataKey="displayDate"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[minRate - padding, maxRate + padding]}
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `Bs.${v.toFixed(0)}`}
            width={60}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            formatter={(value: number) => [`Bs. ${value.toFixed(2)}`, ""]}
          />
          <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
          <Line
            type="monotone"
            dataKey="usd"
            name={tRates("usd_official")}
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="usdt"
            name={tRates("usdt_binance")}
            stroke="#10b981"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="eur"
            name={tRates("eur_bcv")}
            stroke="#f59e0b"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
