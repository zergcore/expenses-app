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
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-center">
          {t("Landing.rates.comparison_title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Visual bar comparison */}
        <div className="space-y-4">
          {/* USD Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">{t("Landing.rates.usd")}</span>
              <span className="text-muted-foreground">
                Bs. {usdRate.toFixed(2)}
              </span>
            </div>
            <div className="h-8 w-full bg-muted rounded-lg overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg transition-all duration-500 flex items-center justify-end pr-2"
                style={{ width: `${usdPercentage}%` }}
              >
                {usdPercentage > 30 && (
                  <span className="text-xs font-medium text-white">
                    Bs. {usdRate.toFixed(2)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* USDT Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">USDT (Binance P2P)</span>
              <span className="text-muted-foreground">
                Bs. {usdtRate.toFixed(2)}
              </span>
            </div>
            <div className="h-8 w-full bg-muted rounded-lg overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg transition-all duration-500 flex items-center justify-end pr-2"
                style={{ width: `${usdtPercentage}%` }}
              >
                {usdtPercentage > 30 && (
                  <span className="text-xs font-medium text-white">
                    Bs. {usdtRate.toFixed(2)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground mb-1">
              {t("Landing.rates.difference")}
            </p>
            <div className="flex items-center justify-center gap-1">
              {isPositive ? (
                <ArrowUpRight className="h-4 w-4 text-emerald-500" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-red-500" />
              )}
              <p
                className={`text-xl font-bold ${isPositive ? "text-emerald-500" : "text-red-500"}`}
              >
                {isPositive ? "+" : ""}
                {difference.toFixed(2)}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">Bs</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground mb-1">
              {t("Landing.rates.premium_discount")}
            </p>
            <div className="flex items-center justify-center gap-1">
              {isPositive ? (
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <p
                className={`text-xl font-bold ${isPositive ? "text-emerald-500" : "text-red-500"}`}
              >
                {isPositive ? "+" : ""}
                {percentageDiff.toFixed(2)}%
              </p>
            </div>
          </div>
        </div>

        {/* Insight */}
        <p className="text-xs text-center text-muted-foreground px-4 py-2 bg-muted/30 rounded-lg">
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
