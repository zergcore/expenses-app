"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  X,
  Settings,
  PiggyBank,
  Receipt,
  User as UserIcon,
} from "lucide-react";
import { StepItem } from "./step-item";
import { User } from "@supabase/supabase-js";

export interface OnboardingStep {
  id: "currency" | "budget" | "expense" | "profile";
  icon: React.ReactNode;
  href: string;
}

interface OnboardingCardProps {
  locale: string;
  hasExpenses: boolean;
  hasBudgets: boolean;
  user: User;
}

const STORAGE_KEY = "onboarding_progress";
const DISMISSED_KEY = "onboarding_dismissed";

export function OnboardingCard({
  locale,
  hasExpenses,
  hasBudgets,
  user,
}: OnboardingCardProps) {
  const t = useTranslations("Onboarding");
  const [isMounted, setIsMounted] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Initialize state as empty to match server, populate in useEffect
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  // 1. Optimization: Handle initialization and prop updates in one effect
  useEffect(() => {
    setIsMounted(true);

    // Check dismissal
    const isDismissed = localStorage.getItem(DISMISSED_KEY) === "true";
    setDismissed(isDismissed);
    if (isDismissed) return;

    // Load saved progress
    const saved = localStorage.getItem(STORAGE_KEY);
    const currentProgress = saved ? JSON.parse(saved) : [];

    // Check for auto-completions based on props
    const newCompletions = new Set(currentProgress);
    if (hasExpenses) newCompletions.add("expense");
    if (hasBudgets) newCompletions.add("budget");

    // Check user metadata for currency and profile
    if (user?.user_metadata?.currency) newCompletions.add("currency");

    // Check profile: has avatar or name is different from email start
    const hasAvatar = !!user?.user_metadata?.avatar_url;
    const hasName =
      user?.user_metadata?.full_name &&
      user.user_metadata.full_name !== user.email?.split("@")[0];
    if (hasAvatar || hasName) newCompletions.add("profile");

    // Only update if different to prevent loops
    if (newCompletions.size !== currentProgress.length) {
      const updated = Array.from(newCompletions) as string[];
      setCompletedSteps(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } else {
      setCompletedSteps(currentProgress);
    }
  }, [hasExpenses, hasBudgets, user]);

  const steps: OnboardingStep[] = useMemo(
    () => [
      {
        id: "currency",
        icon: <Settings className="h-4 w-4" />,
        href: `/${locale}/settings`,
      },
      {
        id: "budget",
        icon: <PiggyBank className="h-4 w-4" />,
        href: `/${locale}/budgets`,
      },
      {
        id: "expense",
        icon: <Receipt className="h-4 w-4" />,
        href: `/${locale}/expenses`,
      },
      {
        id: "profile",
        icon: <UserIcon className="h-4 w-4" />,
        href: `/${locale}/profile`,
      },
    ],
    [locale],
  );

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    localStorage.setItem(DISMISSED_KEY, "true");
  }, []);

  // 2. Optimization: Dynamic import for confetti
  useEffect(() => {
    if (completedSteps.length === 4 && !dismissed && isMounted) {
      // Load library only when needed
      import("canvas-confetti").then((confetti) => {
        confetti.default({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      });

      const timer = setTimeout(handleDismiss, 3000);
      return () => clearTimeout(timer);
    }
  }, [completedSteps.length, dismissed, handleDismiss, isMounted]);

  const toggleStep = (stepId: string) => {
    setCompletedSteps((prev) => {
      const newCompleted = prev.includes(stepId)
        ? prev.filter((s) => s !== stepId)
        : [...prev, stepId];

      localStorage.setItem(STORAGE_KEY, JSON.stringify(newCompleted));
      return newCompleted;
    });
  };

  // Prevent hydration mismatch and render nothing if dismissed
  if (!isMounted || dismissed) return null;

  const progress = (completedSteps.length / steps.length) * 100;
  const isComplete = completedSteps.length === steps.length;

  return (
    <Card className="border-amber-500/50 bg-linear-to-br from-amber-500/5 to-amber-600/10 dark:from-amber-500/10 dark:to-amber-600/5">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          {isComplete ? (
            <span className="text-lg">{t("complete")}</span>
          ) : (
            <>
              <span className="text-amber-600 dark:text-amber-400">✦</span>
              {t("title")}
            </>
          )}
        </CardTitle>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleDismiss}
          className="h-6 w-6 text-muted-foreground hover:text-foreground"
          aria-label={t("dismiss")}
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {t("progress", { completed: completedSteps.length })}
            </span>
          </div>
          <Progress
            value={progress}
            className="h-2"
            indicatorClassName="bg-amber-500"
          />
        </div>

        <div className="space-y-2">
          {steps.map((step) => (
            <StepItem
              key={step.id}
              step={step}
              isComplete={completedSteps.includes(step.id)}
              onToggle={() => toggleStep(step.id)}
              label={t(`steps.${step.id}`)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
