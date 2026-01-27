"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface RateCardProps {
  pair: string;
  rate: string;
  trend?: "up" | "down" | "flat";
  change?: string;
  description?: string;
}

import { useTranslations } from "next-intl";

export function RateCard({
  pair,
  rate,
  trend,
  change,
  description,
  source,
}: RateCardProps & { source?: string }) {
  const t = useTranslations("Landing");

  const getTranslatedDescription = (desc?: string) => {
    if (!desc) return "";
    if (desc === "Binance P2P Avg") return t("binance_p2p_avg");
    if (desc === "BCV Official") return t("bcv_official");
    if (desc === "CoinGecko") return t("coingecko");
    return desc;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{pair}</CardTitle>
        {trend === "up" && <ArrowUp className="h-4 w-4 text-green-500" />}
        {trend === "down" && <ArrowDown className="h-4 w-4 text-red-500" />}
        {trend === "flat" && (
          <Minus className="h-4 w-4 text-muted-foreground" />
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{rate}</div>
        <div className="mt-1 flex items-center justify-between">
          {(change || description) && (
            <p
              className={cn("text-xs text-muted-foreground", {
                "text-green-500": trend === "up",
                "text-red-500": trend === "down",
              })}
            >
              {change && <span className="mr-1">{change}</span>}
              {getTranslatedDescription(description)}
            </p>
          )}
          {source && (
            <span className="text-[10px] text-muted-foreground/50 border px-1 rounded bg-muted/20">
              {source}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
