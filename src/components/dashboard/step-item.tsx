import { cn } from "@/lib/utils";
import { Check, ChevronRight } from "lucide-react";
import Link from "next/link";
import { OnboardingStep } from "./onboarding-card";

export function StepItem({
  step,
  isComplete,
  onToggle,
  label,
}: {
  step: OnboardingStep;
  isComplete: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-lg border p-3 transition-all",
        isComplete
          ? "border-green-500/30 bg-green-500/5"
          : "border-border hover:border-amber-500/50 hover:bg-amber-500/5",
      )}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={onToggle}
          className={cn(
            "flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all",
            isComplete
              ? "border-green-500 bg-green-500 text-white"
              : "border-muted-foreground/50 hover:border-amber-500",
          )}
        >
          {isComplete && <Check className="h-3 w-3" />}
        </button>
        <span
          className={cn(
            "text-sm font-medium",
            isComplete && "line-through text-muted-foreground",
          )}
        >
          {label}
        </span>
      </div>
      <Link
        href={step.href}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        {step.icon}
        <ChevronRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
