"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Copy, Check, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { copyToClipboard } from "@/lib/clipboard";
import { ShareRatesButton } from "@/components/rates/share-rates-button";
import type { RateData } from "@/actions/rates";

interface CurrencyCalculatorProps {
  rates: {
    usdToBs: number;
    usdtToBs: number;
    eurToBs: number;
  };
  allRates?: RateData[];
}

type CurrencyPair = "USD" | "USDT" | "EUR";

export function CurrencyCalculator({ rates, allRates }: CurrencyCalculatorProps) {
  const t = useTranslations();
  const [fromAmount, setFromAmount] = useState<string>("1");
  const [toAmount, setToAmount] = useState<string>("");
  const [currency, setCurrency] = useState<CurrencyPair>("USD");
  const [direction, setDirection] = useState<"toBs" | "fromBs">("toBs");
  const [copied, setCopied] = useState(false);

  const getRateForCurrency = (curr: CurrencyPair): number => {
    switch (curr) {
      case "USD":
        return rates.usdToBs;
      case "USDT":
        return rates.usdtToBs;
      case "EUR":
        return rates.eurToBs;
      default:
        return 0;
    }
  };

  function computeTo(
    from: string,
    rate: number,
    dir: "toBs" | "fromBs",
  ): string {
    const n = parseFloat(from) || 0;
    if (dir === "toBs") return (n * rate).toFixed(2);
    return rate > 0 ? (n / rate).toFixed(2) : "0.00";
  }

  function computeFrom(
    to: string,
    rate: number,
    dir: "toBs" | "fromBs",
  ): string {
    const n = parseFloat(to) || 0;
    if (dir === "toBs") return rate > 0 ? (n / rate).toFixed(2) : "0.00";
    return (n * rate).toFixed(2);
  }

  const handleFromChange = (val: string) => {
    setFromAmount(val);
    setToAmount(computeTo(val, getRateForCurrency(currency), direction));
  };

  const handleToChange = (val: string) => {
    setToAmount(val);
    setFromAmount(computeFrom(val, getRateForCurrency(currency), direction));
  };

  // Recompute toAmount when currency or direction changes
  useEffect(() => {
    setToAmount(computeTo(fromAmount, getRateForCurrency(currency), direction));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currency, direction, rates]);

  const toggleDirection = () => {
    setDirection((prev) => (prev === "toBs" ? "fromBs" : "toBs"));
  };

  const currencySymbols: Record<CurrencyPair, string> = {
    USD: "$",
    USDT: "₮",
    EUR: "€",
  };

  const handleCopyResult = async () => {
    const prefix = direction === "toBs" ? "Bs. " : currencySymbols[currency];
    const textToCopy = `${prefix}${toAmount}`;
    const success = await copyToClipboard(textToCopy);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Card className="w-full">
      <CardContent className="p-4 sm:p-6">
        {/* Title Header */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <h3 className="text-base sm:text-lg md:text-xl font-bold">
            {t("Landing.calculator")}
          </h3>
          {allRates && <ShareRatesButton rates={allRates} />}
        </div>

        {/* Conversion container */}
        <div className="bg-muted/50 rounded-lg p-3 sm:p-4">
          {/* Currency selector row */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-muted-foreground uppercase tracking-wide">
              {t("Landing.currency")}
            </span>
            <Select
              value={currency}
              onValueChange={(val) => setCurrency(val as CurrencyPair)}
            >
              <SelectTrigger className="h-8 w-auto border-0 bg-transparent text-sm font-medium gap-1 px-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">{t("Landing.usd")}</SelectItem>
                <SelectItem value="USDT">{t("Landing.usdt")}</SelectItem>
                <SelectItem value="EUR">{t("Landing.eur")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Vertical conversion layout */}
          <div className="flex flex-col items-center gap-2">
            {/* From input - full width */}
            <div className="w-full">
              <Label className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wide">
                {direction === "toBs" ? currency : "Bs"}
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">
                  {direction === "toBs" ? currencySymbols[currency] : "Bs."}
                </span>
                <Input
                  type="number"
                  value={fromAmount}
                  onChange={(e) => handleFromChange(e.target.value)}
                  className="pl-10 h-10 bg-background border-0 shadow-sm font-semibold text-base"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Swap button - centered */}
            <Button
              variant="secondary"
              size="icon"
              onClick={toggleDirection}
              className="h-8 w-8 rounded-full shrink-0 shadow-sm"
            >
              <ArrowUpDown className="h-4 w-4" />
            </Button>

            {/* To input (result) - full width */}
            <div className="w-full">
              <Label className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wide">
                {direction === "toBs" ? "Bs" : currency}
              </Label>
              <div className="relative flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">
                    {direction === "toBs" ? "Bs." : currencySymbols[currency]}
                  </span>
                  <Input
                    type="number"
                    value={toAmount}
                    onChange={(e) => handleToChange(e.target.value)}
                    className="pl-10 h-10 bg-primary/5 border-primary/20 font-semibold text-base"
                    placeholder="0.00"
                  />
                </div>
                <TooltipProvider>
                  <Tooltip open={copied ? true : undefined}>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleCopyResult}
                        className="shrink-0 h-10 w-10"
                      >
                        {copied ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{copied ? t("Landing.copied") : t("Landing.copy")}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>
        </div>

        {/* Rate info */}
        <div className="text-center text-xs text-muted-foreground mt-3">
          <p className="font-medium">
            1 {currency} = Bs. {getRateForCurrency(currency).toFixed(2)}
          </p>
          <p className="text-[10px] mt-0.5 opacity-70">
            {currency === "USDT"
              ? t("Landing.binanceP2P")
              : t("Landing.bcvOfficial")}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
