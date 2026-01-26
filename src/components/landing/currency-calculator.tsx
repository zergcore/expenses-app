"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

interface CurrencyCalculatorProps {
  rates: {
    usdToBs: number;
    usdtToBs: number;
    eurToBs: number;
  };
}

type CurrencyPair = "USD" | "USDT" | "EUR";

export function CurrencyCalculator({ rates }: CurrencyCalculatorProps) {
  const t = useTranslations();
  const [amount, setAmount] = useState<string>("1");
  const [currency, setCurrency] = useState<CurrencyPair>("USD");
  const [direction, setDirection] = useState<"toBs" | "fromBs">("toBs");
  const [result, setResult] = useState<number>(0);

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

  useEffect(() => {
    const numAmount = parseFloat(amount) || 0;
    const rate = getRateForCurrency(currency);

    if (direction === "toBs") {
      setResult(numAmount * rate);
    } else {
      setResult(rate > 0 ? numAmount / rate : 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amount, currency, direction, rates]);

  const toggleDirection = () => {
    setDirection((prev) => (prev === "toBs" ? "fromBs" : "toBs"));
  };

  const currencySymbols: Record<CurrencyPair, string> = {
    USD: "$",
    USDT: "₮",
    EUR: "€",
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-center">
          {t("Landing.calculator")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="currency">{t("Landing.currency")}</Label>
          <Select
            value={currency}
            onValueChange={(val) => setCurrency(val as CurrencyPair)}
          >
            <SelectTrigger id="currency">
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD (BCV Official)</SelectItem>
              <SelectItem value="USDT">USDT (Binance P2P)</SelectItem>
              <SelectItem value="EUR">EUR (BCV Official)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex-1 space-y-2">
            <Label htmlFor="amount">
              {direction === "toBs" ? currency : "Bs"}
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {direction === "toBs" ? currencySymbols[currency] : "Bs."}
              </span>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-10"
                placeholder="0.00"
              />
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDirection}
            className="mt-6"
          >
            <ArrowLeftRight className="h-5 w-5" />
          </Button>

          <div className="flex-1 space-y-2">
            <Label>{direction === "toBs" ? "Bs" : currency}</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {direction === "toBs" ? "Bs." : currencySymbols[currency]}
              </span>
              <Input
                type="text"
                value={result.toLocaleString("es-VE", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
                readOnly
                className="pl-10 bg-muted"
              />
            </div>
          </div>
        </div>

        <div className="text-center text-sm text-muted-foreground pt-2 border-t">
          <p>
            1 {currency} = Bs. {getRateForCurrency(currency).toFixed(2)}
          </p>
          <p className="text-xs mt-1">
            {currency === "USDT"
              ? t("Landing.binanceP2P")
              : t("Landing.bcvOfficial")}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
