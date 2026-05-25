"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslations } from "next-intl";
import {
  generateOnboardingSuggestions,
  applyOnboardingSuggestions,
  dismissOnboarding,
} from "@/actions/onboarding";
import {
  Percent,
  Check,
  Loader2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  X,
  Wallet,
} from "lucide-react";
import {
  type OnboardingAnswers,
  type OnboardingSuggestions,
} from "@/types/onboarding";

const CATEGORY_OPTIONS = [
  "Food & Drink",
  "Transportation",
  "Housing",
  "Entertainment",
  "Shopping",
  "Health",
  "Pets",
  "Other",
];

export function OnboardingModal() {
  const t = useTranslations();
  const [isOpen, setIsOpen] = useState(true);
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDismissing, setIsDismissing] = useState(false);

  // Wizard state answers
  const [primaryCurrency, setPrimaryCurrency] = useState<
    "USD" | "USDT" | "VES" | "EUR"
  >("USD");
  const [incomeRange, setIncomeRange] = useState<
    "under_500" | "500_1000" | "1000_3000" | "3000_5000" | "over_5000"
  >("1000_3000");
  const [topCategories, setTopCategories] = useState<string[]>([]);
  const [savingsGoal, setSavingsGoal] = useState<
    "none" | "5" | "10" | "20" | "custom"
  >("10");
  const [customSavingsPercent, setCustomSavingsPercent] = useState<number>(15);
  const [budgetStyle, setBudgetStyle] = useState<"strict" | "flexible">(
    "flexible",
  );

  // Step 6 Suggestions State
  const [suggestions, setSuggestions] = useState<OnboardingSuggestions | null>(
    null,
  );
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [errorSuggestions, setErrorSuggestions] = useState<string | null>(null);

  const fetchSuggestions = async () => {
    setLoadingSuggestions(true);
    setErrorSuggestions(null);
    try {
      const answers: OnboardingAnswers = {
        primaryCurrency,
        incomeRange,
        topCategories,
        savingsGoal,
        customSavingsPercent:
          savingsGoal === "custom" ? customSavingsPercent : undefined,
        budgetStyle,
      };
      const res = await generateOnboardingSuggestions(answers);
      if (res.success) {
        setSuggestions(res.suggestions);
      } else {
        setErrorSuggestions(res.error);
      }
    } catch (err) {
      setErrorSuggestions(
        err instanceof Error ? err.message : "Failed to load suggestions",
      );
    } finally {
      setLoadingSuggestions(false);
    }
  };

  if (!isOpen) return null;

  const handleNext = () => {
    if (step === 5) {
      setStep(6);
      fetchSuggestions();
    } else if (step < 6) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSkip = async () => {
    setIsDismissing(true);
    const res = await dismissOnboarding();
    if (res.success) {
      setIsOpen(false);
    } else {
      alert("Error closing onboarding: " + res.error);
    }
    setIsDismissing(false);
  };

  const handleApply = async () => {
    if (!suggestions) return;
    setIsSubmitting(true);
    const res = await applyOnboardingSuggestions(suggestions);
    if (res.success) {
      setIsOpen(false);
    } else {
      alert("Error applying starter plan: " + res.error);
    }
    setIsSubmitting(false);
  };

  const handleCategoryToggle = (category: string) => {
    setTopCategories((prev) => {
      if (prev.includes(category)) {
        return prev.filter((c) => c !== category);
      } else {
        if (prev.length >= 4) {
          // Replace first
          return [...prev.slice(1), category];
        }
        return [...prev, category];
      }
    });
  };

  const handleBudgetAmountChange = (index: number, val: string) => {
    if (!suggestions) return;
    const amount = parseFloat(val) || 0;
    const updatedBudgets = [...suggestions.budgets];
    updatedBudgets[index] = { ...updatedBudgets[index], amount };
    setSuggestions({ ...suggestions, budgets: updatedBudgets });
  };

  const handleGlobalBudgetChange = (val: string) => {
    if (!suggestions || !suggestions.global_budget) return;
    const amount = parseFloat(val) || 0;
    setSuggestions({
      ...suggestions,
      global_budget: { ...suggestions.global_budget, amount },
    });
  };

  const currencySymbols = {
    USD: "$",
    USDT: "₮",
    VES: "Bs.",
    EUR: "€",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-4 mb-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary animate-pulse" />
              {t("Onboarding.modal.title") || "Let's set you up"}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t("Onboarding.modal.subtitle") ||
                "Six quick questions to tailor Fin to your needs."}
            </p>
          </div>
          <button
            onClick={handleSkip}
            className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            disabled={isDismissing || isSubmitting}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mb-6 space-y-2">
          <div className="flex justify-between text-xs font-semibold text-muted-foreground">
            <span>
              {t("Onboarding.modal.step_of", { current: step, total: 6 }) ||
                `Step ${step} of 6`}
            </span>
            <span>{Math.round((step / 6) * 100)}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${(step / 6) * 100}%` }}
            />
          </div>
        </div>

        {/* Wizard content */}
        <div className="flex-1 py-2">
          {/* STEP 1: Currency */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                {t("Onboarding.modal.step.currency.title") ||
                  "Which currency do you mainly use?"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t("Onboarding.modal.step.currency.description") ||
                  "We'll display your default calculations and dashboard stats in this currency."}
              </p>
              <div className="grid grid-cols-2 gap-3 pt-2">
                {(["USD", "USDT", "VES", "EUR"] as const).map((curr) => (
                  <button
                    key={curr}
                    onClick={() => setPrimaryCurrency(curr)}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all duration-200 cursor-pointer ${
                      primaryCurrency === curr
                        ? "border-primary bg-primary/5 text-foreground ring-2 ring-primary/20"
                        : "border-border bg-card/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <span className="text-2xl mb-1">
                      {curr === "USD"
                        ? "🇺🇸"
                        : curr === "USDT"
                          ? "₮"
                          : curr === "VES"
                            ? "🇻🇪"
                            : "🇪🇺"}
                    </span>
                    <span className="font-bold text-sm">{curr}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: Income range */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                {t("Onboarding.modal.step.income.title") ||
                  "What's your monthly income range?"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t("Onboarding.modal.step.income.description") ||
                  "This helps size your starter budgets. Exact details remain private."}
              </p>
              <div className="space-y-2 pt-2">
                {[
                  {
                    key: "under_500",
                    text:
                      t("Onboarding.modal.step.income.under_500", {
                        currency: currencySymbols[primaryCurrency],
                      }) || `Under ${currencySymbols[primaryCurrency]} 500`,
                  },
                  {
                    key: "500_1000",
                    text:
                      t("Onboarding.modal.step.income.500_1000", {
                        currency: currencySymbols[primaryCurrency],
                      }) || `${currencySymbols[primaryCurrency]} 500 – 1,000`,
                  },
                  {
                    key: "1000_3000",
                    text:
                      t("Onboarding.modal.step.income.1000_3000", {
                        currency: currencySymbols[primaryCurrency],
                      }) || `${currencySymbols[primaryCurrency]} 1,000 – 3,000`,
                  },
                  {
                    key: "3000_5000",
                    text:
                      t("Onboarding.modal.step.income.3000_5000", {
                        currency: currencySymbols[primaryCurrency],
                      }) || `${currencySymbols[primaryCurrency]} 3,000 – 5,000`,
                  },
                  {
                    key: "over_5000",
                    text:
                      t("Onboarding.modal.step.income.over_5000", {
                        currency: currencySymbols[primaryCurrency],
                      }) || `Over ${currencySymbols[primaryCurrency]} 5,000`,
                  },
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() =>
                      setIncomeRange(
                        item.key as
                          | "under_500"
                          | "500_1000"
                          | "1000_3000"
                          | "3000_5000"
                          | "over_5000",
                      )
                    }
                    className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                      incomeRange === item.key
                        ? "border-primary bg-primary/5 text-foreground font-semibold"
                        : "border-border bg-card/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <span>{item.text}</span>
                    <div
                      className={`h-4 w-4 rounded-full border flex items-center justify-center ${incomeRange === item.key ? "border-primary" : "border-muted"}`}
                    >
                      {incomeRange === item.key && (
                        <div className="h-2 w-2 rounded-full bg-primary" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: Top spending categories */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                {t("Onboarding.modal.step.categories.title") ||
                  "Pick up to 4 spending areas"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t("Onboarding.modal.step.categories.description") ||
                  "Choose the fields you expect to spend on most. We'll pre-fill budgets for them."}
              </p>
              <div className="grid grid-cols-2 gap-2 pt-2">
                {CATEGORY_OPTIONS.map((cat) => {
                  const isSelected = topCategories.includes(cat);
                  return (
                    <button
                      key={cat}
                      onClick={() => handleCategoryToggle(cat)}
                      className={`flex items-center gap-2 p-3 rounded-lg border text-left transition-all duration-200 cursor-pointer ${
                        isSelected
                          ? "border-primary bg-primary/5 text-foreground font-medium"
                          : "border-border bg-card/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      <div
                        className={`h-4 w-4 rounded border flex items-center justify-center ${isSelected ? "border-primary bg-primary text-primary-foreground" : "border-muted"}`}
                      >
                        {isSelected && <Check className="h-3 w-3" />}
                      </div>
                      <span className="text-xs sm:text-sm">
                        {t(`CategoryNames.${cat}`) || cat}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 4: Savings goal */}
          {step === 4 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                {t("Onboarding.modal.step.savings.title") ||
                  "How much do you want to save each month?"}
              </h3>
              <div className="space-y-2 pt-2">
                {[
                  {
                    key: "none",
                    text:
                      t("Onboarding.modal.step.savings.none") ||
                      "Not yet — just track spending",
                  },
                  {
                    key: "5",
                    text:
                      t("Onboarding.modal.step.savings.5") || "5% of income",
                  },
                  {
                    key: "10",
                    text:
                      t("Onboarding.modal.step.savings.10") || "10% of income",
                  },
                  {
                    key: "20",
                    text:
                      t("Onboarding.modal.step.savings.20") || "20% of income",
                  },
                  {
                    key: "custom",
                    text:
                      t("Onboarding.modal.step.savings.custom") ||
                      "A custom percentage",
                  },
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() =>
                      setSavingsGoal(
                        item.key as "none" | "5" | "10" | "20" | "custom",
                      )
                    }
                    className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                      savingsGoal === item.key
                        ? "border-primary bg-primary/5 text-foreground font-semibold"
                        : "border-border bg-card/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <span>{item.text}</span>
                    <div
                      className={`h-4 w-4 rounded-full border flex items-center justify-center ${savingsGoal === item.key ? "border-primary" : "border-muted"}`}
                    >
                      {savingsGoal === item.key && (
                        <div className="h-2 w-2 rounded-full bg-primary" />
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {savingsGoal === "custom" && (
                <div className="pt-2 animate-in fade-in slide-in-from-top-2">
                  <Label
                    htmlFor="custom-savings-percent"
                    className="text-xs font-semibold text-muted-foreground uppercase"
                  >
                    {t("Onboarding.modal.step.savings.custom_label") ||
                      "Savings %"}
                  </Label>
                  <div className="relative mt-1 max-w-[120px]">
                    <Input
                      id="custom-savings-percent"
                      type="number"
                      min={1}
                      max={50}
                      value={customSavingsPercent}
                      onChange={(e) =>
                        setCustomSavingsPercent(
                          Math.min(
                            50,
                            Math.max(1, parseInt(e.target.value) || 0),
                          ),
                        )
                      }
                      className="pr-8 font-semibold text-base"
                    />
                    <Percent className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 5: Budget style */}
          {step === 5 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                {t("Onboarding.modal.step.style.title") ||
                  "What kind of budgeter are you?"}
              </h3>
              <div className="space-y-3 pt-2">
                {[
                  {
                    key: "strict",
                    text:
                      t("Onboarding.modal.step.style.strict") ||
                      "Strict — alert me when I'm close to limits",
                    desc: "Tighter categories, alerts at 80% limit.",
                  },
                  {
                    key: "flexible",
                    text:
                      t("Onboarding.modal.step.style.flexible") ||
                      "Flexible — guidelines, not hard rules",
                    desc: "Looser limits, alerts at 100% limit.",
                  },
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() =>
                      setBudgetStyle(item.key as "strict" | "flexible")
                    }
                    className={`w-full flex flex-col p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                      budgetStyle === item.key
                        ? "border-primary bg-primary/5 text-foreground"
                        : "border-border bg-card/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <span className="font-semibold text-sm sm:text-base">
                      {item.text}
                    </span>
                    <span className="text-xs text-muted-foreground mt-1">
                      {item.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 6: Review */}
          {step === 6 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                {t("Onboarding.modal.step.review.title") ||
                  "Here is your starter plan"}
              </h3>
              <p className="text-xs text-muted-foreground">
                {t("Onboarding.modal.step.review.description") ||
                  "Edit any suggested monthly limit below, then click apply."}
              </p>

              {loadingSuggestions && (
                <div className="flex flex-col items-center justify-center py-10 space-y-3">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="text-sm font-medium text-muted-foreground animate-pulse">
                    {t("Onboarding.modal.generating") ||
                      "Generating your starter plan..."}
                  </span>
                </div>
              )}

              {errorSuggestions && (
                <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive space-y-2">
                  <p>
                    {t("Onboarding.modal.error") ||
                      "We couldn't generate suggestions right now. You can skip and set things up manually."}
                  </p>
                  <p className="text-xs opacity-80">
                    Reason: {errorSuggestions}
                  </p>
                </div>
              )}

              {suggestions && !loadingSuggestions && (
                <div className="space-y-4 max-h-[45vh] overflow-y-auto pr-1">
                  {suggestions.summary && (
                    <p className="text-xs italic bg-muted/30 p-2.5 rounded-lg border text-muted-foreground">
                      {suggestions.summary}
                    </p>
                  )}

                  <div className="space-y-2">
                    {suggestions.budgets.map((b, idx) => (
                      <div
                        key={b.category_name}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card/50"
                      >
                        <div className="flex flex-col text-left">
                          <span className="text-xs font-semibold text-foreground">
                            {t(`CategoryNames.${b.category_name}`) ||
                              b.category_name}
                          </span>
                          <span className="text-[10px] text-muted-foreground max-w-[200px] sm:max-w-[240px] truncate">
                            {b.reasoning}
                          </span>
                        </div>
                        <div className="relative w-28">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                            {currencySymbols[b.currency]}
                          </span>
                          <Input
                            type="number"
                            value={b.amount || ""}
                            onChange={(e) =>
                              handleBudgetAmountChange(idx, e.target.value)
                            }
                            className="pl-8 text-right h-8 text-sm font-bold bg-background"
                          />
                        </div>
                      </div>
                    ))}

                    {suggestions.global_budget && (
                      <div className="flex items-center justify-between p-3 rounded-lg border-2 border-primary/20 bg-primary/5 mt-4">
                        <div className="flex flex-col text-left">
                          <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                            <Wallet className="h-3.5 w-3.5 text-primary" />
                            {t("Budgets.global_budget") ||
                              "Global Budget Limit"}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            Overall monthly spending cap suggestion.
                          </span>
                        </div>
                        <div className="relative w-28">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                            {
                              currencySymbols[
                                suggestions.global_budget.currency
                              ]
                            }
                          </span>
                          <Input
                            type="number"
                            value={suggestions.global_budget.amount || ""}
                            onChange={(e) =>
                              handleGlobalBudgetChange(e.target.value)
                            }
                            className="pl-8 text-right h-8 text-sm font-bold bg-background border-primary/30"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="border-t pt-4 mt-6 flex items-center justify-between">
          <div className="flex gap-2">
            {step > 1 && (
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={isSubmitting || isDismissing}
                size="sm"
                className="cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4 mr-1.5" />
                {t("Onboarding.modal.back") || "Back"}
              </Button>
            )}

            <Button
              variant="ghost"
              onClick={handleSkip}
              disabled={isSubmitting || isDismissing}
              size="sm"
              className="text-muted-foreground hover:text-foreground cursor-pointer"
            >
              {isDismissing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
              ) : null}
              {t("Onboarding.modal.skip") || "Skip for now"}
            </Button>
          </div>

          <div>
            {step < 6 ? (
              <Button
                onClick={handleNext}
                disabled={step === 3 && topCategories.length === 0}
                size="sm"
                className="cursor-pointer"
              >
                {t("Onboarding.modal.next") || "Next"}
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            ) : (
              <Button
                onClick={handleApply}
                disabled={!suggestions || isSubmitting || isDismissing}
                size="sm"
                className="shadow-md shadow-primary/20 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                    {t("Common.saving") || "Saving..."}
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-1.5" />
                    {t("Onboarding.modal.apply") || "Apply suggestions"}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
