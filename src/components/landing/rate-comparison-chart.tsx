"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { useTranslations } from "next-intl";

interface RateComparisonChartProps {
  usdRate: number;
  usdtRate: number;
}

export function RateComparisonChart({
  usdRate,
  usdtRate,
}: RateComparisonChartProps) {
  const difference = usdtRate - usdRate;
  const percentageDiff = usdRate > 0 ? (difference / usdRate) * 100 : 0;
  const isPositive = difference > 0;

  // Calculate percentage of max for the visual bars
  const maxRate = Math.max(usdRate, usdtRate);
  const usdPercentage = maxRate > 0 ? (usdRate / maxRate) * 100 : 0;
  const usdtPercentage = maxRate > 0 ? (usdtRate / maxRate) * 100 : 0;

  const t = useTranslations();
  return (
    <Card className="w-full">
      <CardHeader className="pb-3 sm:pb-6">
        <CardTitle className="text-lg sm:text-xl font-bold text-center">
          {t("Landing.rates.comparison_title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6">
        {/* Visual bar comparison */}
        <div className="space-y-3 sm:space-y-4">
          {/* USD Bar */}
          <div className="space-y-1.5 sm:space-y-2">
            <div className="flex justify-between text-xs sm:text-sm">
              <span className="font-medium">{t("Landing.rates.usd")}</span>
              <span className="text-muted-foreground">
                Bs. {usdRate.toFixed(2)}
              </span>
            </div>
            <div className="h-7 sm:h-8 w-full bg-muted rounded-lg overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg transition-all duration-500 flex items-center justify-end pr-2"
                style={{ width: `${usdPercentage}%` }}
              >
                {usdPercentage > 35 && (
                  <span className="text-[10px] sm:text-xs font-medium text-white">
                    Bs. {usdRate.toFixed(2)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* USDT Bar */}
          <div className="space-y-1.5 sm:space-y-2">
            <div className="flex justify-between text-xs sm:text-sm">
              <span className="font-medium">USDT (Binance P2P)</span>
              <span className="text-muted-foreground">
                Bs. {usdtRate.toFixed(2)}
              </span>
            </div>
            <div className="h-7 sm:h-8 w-full bg-muted rounded-lg overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg transition-all duration-500 flex items-center justify-end pr-2"
                style={{ width: `${usdtPercentage}%` }}
              >
                {usdtPercentage > 35 && (
                  <span className="text-[10px] sm:text-xs font-medium text-white">
                    Bs. {usdtRate.toFixed(2)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats - stack on mobile */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-3 sm:pt-4 border-t">
          <div className="text-center p-2.5 sm:p-3 rounded-lg bg-muted/50">
            <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">
              {t("Landing.rates.difference")}
            </p>
            <div className="flex items-center justify-center gap-0.5 sm:gap-1">
              {isPositive ? (
                <ArrowUpRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-500" />
              ) : (
                <ArrowDownRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-500" />
              )}
              <p
                className={`text-lg sm:text-xl font-bold ${isPositive ? "text-emerald-500" : "text-red-500"}`}
              >
                {isPositive ? "+" : ""}
                {difference.toFixed(2)}
              </p>
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Bs</p>
          </div>
          <div className="text-center p-2.5 sm:p-3 rounded-lg bg-muted/50">
            <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">
              {t("Landing.rates.premium_discount")}
            </p>
            <div className="flex items-center justify-center gap-0.5 sm:gap-1">
              {isPositive ? (
                <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-500" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-500" />
              )}
              <p
                className={`text-lg sm:text-xl font-bold ${isPositive ? "text-emerald-500" : "text-red-500"}`}
              >
                {isPositive ? "+" : ""}
                {percentageDiff.toFixed(2)}%
              </p>
            </div>
          </div>
        </div>

        {/* Insight */}
        <p className="text-[10px] sm:text-xs text-center text-muted-foreground px-3 sm:px-4 py-2 bg-muted/30 rounded-lg">
          {isPositive ? (
            <span className="flex items-center justify-center gap-1">
              <TrendingUp className="h-3 w-3 text-emerald-500" />
              {t("Landing.rates.usdt_premium")}
            </span>
          ) : (
            <span className="flex items-center justify-center gap-1">
              <TrendingDown className="h-3 w-3 text-red-500" />
              {t("Landing.rates.usdt_discount")}
            </span>
          )}
        </p>
      </CardContent>
    </Card>
  );
}
