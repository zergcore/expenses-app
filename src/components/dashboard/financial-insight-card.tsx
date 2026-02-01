import { getFinancialInsight, type FinancialInsight } from "@/actions/advisor";
import { getTranslations, getLocale } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertTriangle,
  Lightbulb,
  CheckCircle,
  Sparkles,
  TrendingUp,
  Clock,
} from "lucide-react";
import type { FinancialTip, SupportedLocale } from "@/lib/advisor/types";

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
  t: Awaited<ReturnType<typeof getTranslations>>;
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
    <Card className="border-dashed">
      <CardContent className="py-8 text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
          <Sparkles className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">{message}</p>
      </CardContent>
    </Card>
  );
}

// --- Main Component ---

export async function FinancialInsightCard() {
  const t = await getTranslations("Advisor");
  const locale = (await getLocale()) as SupportedLocale;

  const result = await getFinancialInsight(locale);

  if (!result.success || !result.insight) {
    return <EmptyState message={result.error || t("noData")} />;
  }

  const { insight } = result;

  return (
    <Card className="bg-linear-to-br from-violet-500/5 via-transparent to-fuchsia-500/5 border-violet-500/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-violet-500" />
            {t("title")}
          </CardTitle>
          <span className="text-xs text-muted-foreground">
            {t("lastUpdated")}{" "}
            {new Intl.DateTimeFormat(locale, {
              hour: "numeric",
              minute: "numeric",
            }).format(insight.generatedAt)}
          </span>
        </div>
        {insight.summary && (
          <p className="text-sm text-muted-foreground">{insight.summary}</p>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Tips */}
        <div className="space-y-2">
          {insight.tips.map((tip, index) => (
            <TipCard
              key={index}
              tip={tip}
              typeLabel={t(`tipTypes.${tip.type}`)}
            />
          ))}
        </div>

        {/* Metrics footer */}
        <div className="pt-2 border-t border-border/50">
          <MetricsSummary insight={insight} t={t} />
        </div>
      </CardContent>
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
