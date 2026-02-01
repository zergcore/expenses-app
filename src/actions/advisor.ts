"use server";

/**
 * Financial Advisor Server Actions
 *
 * This module handles:
 * 1. Data aggregation from expenses and budgets
 * 2. Anonymization before AI consumption
 * 3. AI synthesis via Gemini 2.5 Flash
 * 4. Caching with Supabase TTL pattern
 */

import { createClient } from "@/lib/supabase/server";
import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { revalidatePath } from "next/cache";

import { anonymizeExpenses, validateNoPI } from "@/lib/advisor/anonymizer";
import { calculateFinancialMetrics } from "@/lib/advisor/heuristics";
import {
  financialInsightResponseSchema,
  type FinancialMetrics,
  type FinancialTip,
  type SupportedLocale,
  type AggregatedFinancialData,
} from "@/lib/advisor/types";

// --- Types ---

export interface FinancialInsight {
  id: string;
  tips: FinancialTip[];
  summary: string | null;
  metrics: FinancialMetrics;
  generatedAt: Date;
  isStale: boolean;
}

export interface GetInsightResult {
  success: boolean;
  insight?: FinancialInsight;
  error?: string;
}

// --- Prompt Templates ---

const PROMPT_TEMPLATES = {
  es: {
    role: "Eres un coach financiero práctico para personas en economías con alta inflación y múltiples monedas (Venezuela).",
    rules: [
      "Proporciona EXACTAMENTE 3 consejos cortos y accionables.",
      "Enfócate en: liquidez, fuga inflacionaria, y ahorro.",
      "Sé directo, como un amigo que entiende de finanzas.",
      "Usa datos concretos del contexto proporcionado.",
      "Responde siempre en español.",
      "Cada consejo debe tener un título corto (máximo 50 caracteres) y un cuerpo (máximo 200 caracteres).",
      "Asigna un tipo a cada consejo: 'warning' para alertas, 'tip' para sugerencias, 'success' para logros.",
    ],
    contextLabels: {
      projectedSpending: "Gasto mensual proyectado",
      burnRate: "Velocidad de gasto",
      unbudgetedFriction: "Gastos no presupuestados",
      rateVolatility: "Volatilidad cambiaria (7 días)",
      budgetUsage: "Uso del presupuesto",
      topCategories: "Principales categorías de gasto",
    },
  },
  en: {
    role: "You are a practical financial coach for people navigating high-inflation, multi-currency economies (Venezuela).",
    rules: [
      "Provide EXACTLY 3 short, actionable tips.",
      "Focus on: liquidity, inflation leakage, and savings.",
      "Be direct, like a friend who understands finance.",
      "Use concrete data from the provided context.",
      "Always respond in English.",
      "Each tip must have a short title (max 50 chars) and body (max 200 chars).",
      "Assign a type to each tip: 'warning' for alerts, 'tip' for suggestions, 'success' for achievements.",
    ],
    contextLabels: {
      projectedSpending: "Projected monthly spending",
      burnRate: "Daily burn rate",
      unbudgetedFriction: "Unbudgeted expenses",
      rateVolatility: "Rate volatility (7 days)",
      budgetUsage: "Budget utilization",
      topCategories: "Top spending categories",
    },
  },
};

function buildSystemPrompt(
  locale: SupportedLocale,
  data: AggregatedFinancialData,
): string {
  const t = PROMPT_TEMPLATES[locale];
  const m = data.metrics;
  const l = t.contextLabels;

  const topCatsStr = m.topCategories
    .slice(0, 3)
    .map((c) => `${c.name}: $${c.amountUSD.toFixed(2)} (${c.percentage}%)`)
    .join(", ");

  return `${t.role}

CONTEXT:
- ${l.projectedSpending}: $${m.sProj.toFixed(2)} USD
- ${l.burnRate}: $${m.spendingVelocityUSD.toFixed(2)} USD/day
- ${l.unbudgetedFriction}: ${(m.unbudgetedRatio * 100).toFixed(1)}%
- ${l.rateVolatility}: ${m.rateVolatility > 0 ? "+" : ""}${m.rateVolatility.toFixed(1)}%
- ${l.budgetUsage}: ${data.budgetStatus.utilizationPercent.toFixed(0)}%
- ${l.topCategories}: ${topCatsStr || "N/A"}
- Days remaining in month: ${m.daysRemaining}

RULES:
${t.rules.map((r, i) => `${i + 1}. ${r}`).join("\n")}`;
}

// --- Cache Logic ---

const CACHE_DURATION_HOURS = 24; // Insights valid for 24 hours

async function getCachedInsight(
  userId: string,
  month: number,
  year: number,
  locale: SupportedLocale,
): Promise<FinancialInsight | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("financial_insights")
    .select("*")
    .eq("user_id", userId)
    .eq("month", month)
    .eq("year", year)
    .eq("locale", locale)
    .single();

  if (error || !data) return null;

  const validUntil = new Date(data.valid_until);
  const isStale = validUntil < new Date();

  return {
    id: data.id,
    tips: data.tips as FinancialTip[],
    summary: data.summary,
    metrics: data.metrics as FinancialMetrics,
    generatedAt: new Date(data.generated_at),
    isStale,
  };
}

async function saveInsight(
  userId: string,
  month: number,
  year: number,
  locale: SupportedLocale,
  metrics: FinancialMetrics,
  tips: FinancialTip[],
  summary: string | null,
): Promise<string> {
  const supabase = await createClient();

  const validUntil = new Date();
  validUntil.setHours(validUntil.getHours() + CACHE_DURATION_HOURS);

  const { data, error } = await supabase
    .from("financial_insights")
    .upsert(
      {
        user_id: userId,
        month,
        year,
        locale,
        metrics,
        tips,
        summary,
        generated_at: new Date().toISOString(),
        valid_until: validUntil.toISOString(),
      },
      {
        onConflict: "user_id,month,year",
      },
    )
    .select("id")
    .single();

  if (error) {
    console.error("Failed to save insight:", error);
    throw new Error("Failed to save financial insight");
  }

  return data.id;
}

// --- Data Fetching ---

async function fetchMonthlyData(userId: string, month: number, year: number) {
  const supabase = await createClient();

  const start = new Date(year, month, 1).toISOString();
  const end = new Date(year, month + 1, 0).toISOString();

  // Parallel fetch expenses, budgets, and rates
  const [expensesRes, budgetsRes, ratesRes] = await Promise.all([
    supabase
      .from("expenses")
      .select(
        `
        id, amount, currency, description, date, equivalents,
        category:categories (name, icon, color)
      `,
      )
      .eq("user_id", userId)
      .gte("date", start)
      .lte("date", end),

    supabase
      .from("budgets")
      .select("id, amount, currency, category_id, spent:amount")
      .eq("user_id", userId),

    // Get current and previous rates for volatility calculation
    supabase
      .from("exchange_rates")
      .select("pair, rate, source, created_at")
      .eq("pair", "USD / VED")
      .eq("source", "BCV Official")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  return {
    expenses: expensesRes.data || [],
    budgets: budgetsRes.data || [],
    rates: ratesRes.data || [],
  };
}

// --- Main Action ---

export async function getFinancialInsight(
  locale: SupportedLocale = "es",
  forceRefresh: boolean = false,
): Promise<GetInsightResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();

  // Check cache first (unless force refresh)
  if (!forceRefresh) {
    const cached = await getCachedInsight(user.id, month, year, locale);
    if (cached && !cached.isStale) {
      return { success: true, insight: cached };
    }
  }

  try {
    // Fetch monthly data
    const { expenses, budgets, rates } = await fetchMonthlyData(
      user.id,
      month,
      year,
    );

    // Check if user has enough data
    if (expenses.length === 0) {
      return {
        success: false,
        error: "No expenses found for this month. Add some expenses first!",
      };
    }

    // Anonymize expenses
    const anonymizedExpenses = anonymizeExpenses(
      expenses as unknown as Parameters<typeof anonymizeExpenses>[0],
    );

    // Get rate info for volatility
    const currentRate = rates[0]?.rate || 0;
    const weekAgoRate = rates[7]?.rate || currentRate; // ~7 days ago

    // Calculate metrics
    const aggregatedData = calculateFinancialMetrics(
      anonymizedExpenses,
      budgets.map((b) => ({
        id: b.id,
        amount: b.amount,
        currency: b.currency || "USD",
        category_id: b.category_id,
        spent: b.spent || 0,
      })),
      {
        currentUSDVES: Number(currentRate),
        currentUSDTVES: Number(currentRate) * 1.02, // Approximate
        previousUSDVES: Number(weekAgoRate),
      },
      now,
    );

    // Validate no PII before AI call
    validateNoPI(aggregatedData);

    // Build prompt
    const systemPrompt = buildSystemPrompt(locale, aggregatedData);

    // Call Gemini
    const { object: aiResponse } = await generateObject({
      model: google("gemini-2.5-flash"),
      schema: financialInsightResponseSchema,
      system: systemPrompt,
      prompt:
        locale === "es"
          ? "Genera 3 consejos financieros personalizados basados en el contexto proporcionado."
          : "Generate 3 personalized financial tips based on the provided context.",
    });

    // Save to cache
    const insightId = await saveInsight(
      user.id,
      month,
      year,
      locale,
      aggregatedData.metrics,
      aiResponse.tips,
      aiResponse.summary || null,
    );

    // Note: We do NOT call revalidatePath here because this function is called
    // directly by Server Components during render. Revalidation should be handled
    // by the caller if it's a mutation/action (like refreshFinancialInsight).

    return {
      success: true,
      insight: {
        id: insightId,
        tips: aiResponse.tips,
        summary: aiResponse.summary || null,
        metrics: aggregatedData.metrics,
        generatedAt: new Date(),
        isStale: false,
      },
    };
  } catch (error) {
    console.error("Failed to generate financial insight:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to generate financial insight",
    };
  }
}

/**
 * Manually refresh insights (rate-limited by cache TTL).
 */
export async function refreshFinancialInsight(
  locale: SupportedLocale = "es",
): Promise<GetInsightResult> {
  const result = await getFinancialInsight(locale, true);
  revalidatePath("/dashboard");
  return result;
}
