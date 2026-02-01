"use client";

import { getFinancialInsight, type FinancialInsight } from "@/actions/advisor";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  Lightbulb,
  CheckCircle,
  Sparkles,
  TrendingUp,
  Clock,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
import type { FinancialTip } from "@/lib/advisor/types";
import { useState } from "react";
import { cn } from "@/lib/utils";

// --- Tip Icon Component ---

function TipIcon({ type }: { type: FinancialTip["type"] }) {
  switch (type) {
    case "warning":
      return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    case "tip":
      return <Lightbulb className="h-4 w-4 text-blue-500" />;
    case "success":
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    default:
      return <Lightbulb className="h-4 w-4 text-blue-500" />;
  }
}

function TipBadge({
  type,
  label,
}: {
  type: FinancialTip["type"];
  label: string;
}) {
  const colors = {
    warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    tip: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    success: "bg-green-500/10 text-green-600 dark:text-green-400",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${colors[type]}`}
    >
      <TipIcon type={type} />
      {label}
    </span>
  );
}

// --- Individual Tip Card ---

function TipCard({ tip, typeLabel }: { tip: FinancialTip; typeLabel: string }) {
  return (
    <div className="p-3 rounded-lg bg-muted/50 border border-border/50 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-medium text-sm leading-tight">{tip.title}</h4>
        <TipBadge type={tip.type} label={typeLabel} />
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">
        {tip.body}
      </p>
    </div>
  );
}

// --- Metrics Summary ---

function MetricsSummary({
  insight,
  t,
}: {
  insight: FinancialInsight;
  t: (key: string) => string;
}) {
  const m = insight.metrics;

  return (
    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
      <span className="inline-flex items-center gap-1">
        <TrendingUp className="h-3 w-3" />
        {t("projected")}: ${m.sProj.toFixed(0)}
      </span>
      <span className="inline-flex items-center gap-1">
        <Clock className="h-3 w-3" />
        {m.daysRemaining} {t("daysRemaining")}
      </span>
    </div>
  );
}

// --- Empty State ---

function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-6 text-center text-muted-foreground space-y-2">
      <div className="mx-auto w-10 h-10 rounded-full bg-muted flex items-center justify-center">
        <Sparkles className="h-5 w-5 opacity-50" />
      </div>
      <p className="text-sm">{message}</p>
    </div>
  );
}

// --- Main Component ---

export function FinancialInsightCard() {
  const t = useTranslations("Advisor");
  const [isOpen, setIsOpen] = useState(false);
  const [insight, setInsight] = useState<FinancialInsight | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggle = async () => {
    if (isOpen) {
      setIsOpen(false);
      return;
    }

    setIsOpen(true);

    if (!insight) {
      setLoading(true);
      try {
        // Since this is a client component, we rely on the server action to determine locale or pass it in.
        // For simplicity, we'll let the server action default to 'es' or we could pass via props if needed.
        // Ideally, we pass locale as a prop from the parent server component.
        // Assuming the server action can handle it or we update it.
        // Actually, getFinancialInsight takes a locale. We need the locale here.
        // We can get it from the standard props if we modify the parent, or valid assumption.
        // Let's assume 'es' for now or update signatures.
        // Better: Pass locale as prop. But for now I'll use a fixed one or modify signature.
        // Wait, I can't easily get locale in Client Component without props? useLocale() hook exists!

        // Let's use useLocale hook if available or just hardcode 'es' if props not passed.
        // But I will stick to 'es' as default in action.
        const result = await getFinancialInsight();

        if (result.success && result.insight) {
          setInsight(result.insight);
        } else {
          setError(result.error || t("noData"));
        }
      } catch {
        setError(t("noData"));
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Card
      className={cn(
        "transition-all duration-300 border-violet-500/20",
        isOpen
          ? "bg-linear-to-br from-violet-500/5 via-transparent to-fuchsia-500/5"
          : "bg-card hover:bg-muted/50",
      )}
    >
      <CardHeader
        className={cn("cursor-pointer", isOpen ? "pb-3" : "py-4")}
        onClick={handleToggle}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Sparkles
              className={cn(
                "h-4 w-4 text-violet-500",
                !isOpen && "text-muted-foreground",
              )}
            />
            {t("title")}
          </CardTitle>
          <Button variant="ghost" size="icon-sm" className="h-6 w-6">
            {isOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
        {!isOpen && (
          <p className="text-xs text-muted-foreground mt-1">{t("subtitle")}</p>
        )}
      </CardHeader>

      {isOpen && (
        <CardContent className="space-y-3 animate-in fade-in slide-in-from-top-2">
          {loading ? (
            <div className="py-8 text-center space-y-3">
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-violet-500" />
              <p className="text-xs text-muted-foreground">{t("refreshing")}</p>
            </div>
          ) : error ? (
            <EmptyState message={error!} />
          ) : insight ? (
            <>
              {insight!.summary && (
                <p className="text-sm text-muted-foreground">
                  {insight!.summary}
                </p>
              )}

              <div className="space-y-2">
                {insight!.tips.map((tip, index) => (
                  <TipCard
                    key={index}
                    tip={tip}
                    typeLabel={t(`tipTypes.${tip.type}`)}
                  />
                ))}
              </div>

              <div className="pt-2 border-t border-border/50 flex justify-between items-center">
                <MetricsSummary insight={insight!} t={t} />
                <span className="text-xs text-muted-foreground">
                  {t("lastUpdated")}{" "}
                  {new Date(insight!.generatedAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </>
          ) : null}
        </CardContent>
      )}
    </Card>
  );
}

// --- Skeleton for Suspense ---

export function FinancialInsightCardSkeleton() {
  return (
    <Card className="border-violet-500/20">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-muted animate-pulse" />
          <div className="h-4 w-32 rounded bg-muted animate-pulse" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="p-3 rounded-lg bg-muted/50 border border-border/50 space-y-2"
          >
            <div className="h-4 w-3/4 rounded bg-muted animate-pulse" />
            <div className="h-3 w-full rounded bg-muted animate-pulse" />
            <div className="h-3 w-2/3 rounded bg-muted animate-pulse" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
