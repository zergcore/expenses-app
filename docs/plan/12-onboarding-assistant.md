# Phase 3 — Onboarding AI Assistant (Batch 2)

> Item #11. Modal on first login. 6-step wizard. Single AI call at the end. Output: prefilled budgets the user accepts or skips.

---

## 1. UX

### Where it lives
- Component: `<OnboardingModal>` rendered inside `(dashboard)/layout.tsx`.
- Mounted only when `user.user_metadata.onboarding_complete !== true`.
- Modal blocks the dashboard underneath but is dismissible via "Skip for now".

### When it appears
- First successful sign-in after registration (or the next visit after registering — Supabase Auth UI redirects to the dashboard, where the layout renders the modal).
- Never on subsequent sessions once `onboarding_complete = true`.
- Survives mid-flow page reloads (user metadata holds the flag; if user closes mid-wizard, modal reopens on next dashboard load until "Skip" or "Apply" is pressed).

### Trigger to dismiss
- "Apply suggestions" → marks `onboarding_complete = true`.
- "Skip for now" → marks `onboarding_complete = true` (won't reopen).
- Closing the modal via Escape / X button → equivalent to Skip.

### Modal layout (every step)
```
╭──────────────────────────────────────────────╮
│  Step 2 of 6                          [×]    │
│  ▰▰▱▱▱▱                                       │
│                                              │
│  What's your monthly income range?           │
│  Used only to size your budgets. Pick a      │
│  range — the exact amount stays private.     │
│                                              │
│  ◯ Under USD 500                              │
│  ◉ USD 500 – 1,000                            │
│  ◯ USD 1,000 – 3,000                          │
│  ◯ USD 3,000 – 5,000                          │
│  ◯ Over USD 5,000                             │
│                                              │
│  [Back]                            [Next →]  │
│                                              │
│  Skip for now                                │
╰──────────────────────────────────────────────╯
```

---

## 2. The 6 Steps

### Step 1 — Primary currency
- 4 large radio cards: USD, USDT, VES, EUR.
- Each card shows the currency code + flag emoji + a one-line "what we'll show in" description.

### Step 2 — Income range
- 5 buttons (radio group): bracketed ranges. Currency comes from Step 1.
- Reasoning: range is enough for sizing budgets; we never need exact income, so we never ask.

### Step 3 — Top spending categories (multi-select, max 4)
- All 8 default categories shown as toggleable chips: Food, Transport, Housing, Entertainment, Shopping, Health, Pets, Other.
- "Pick up to 4" — selecting a 5th replaces the oldest (or shows "limit reached" inline).
- "Next" enabled when ≥ 1 selected.

### Step 4 — Savings goal
- 5 options: None / 5% / 10% / 20% / Custom %.
- Custom shows a number input (1–50, integer).

### Step 5 — Budget style
- 2 options: Strict / Flexible.
- Strict → tighter category limits, alerts at 80% used.
- Flexible → looser category limits, alerts at 100% used.

### Step 6 — Review
- Triggered the AI call on entry (`useEffect` runs once when step becomes active).
- Loading skeleton: "Generating your plan…"
- On success: list of suggested budgets (category icon + name + amount). Amounts editable inline (`<input type="number">`).
- "Apply suggestions" → `applyOnboardingSuggestions(suggestions)` Server Action.
- "Skip for now" → close, mark complete.
- On error: "We couldn't generate suggestions right now. You can skip and set things up manually."

---

## 3. Conversation Design (single AI call)

After Step 5, all answers are bundled into a single object and sent to a Server Action that calls Gemini once via `generateObject` with a Zod schema.

### System prompt (built from answers)

```typescript
const systemPrompt = `You are a financial onboarding assistant for Fin, a multi-currency expense-tracking app.
Your task: produce a starter budget plan for a new user based on their preferences.

User profile:
- Primary currency: ${answers.primaryCurrency}
- Monthly income range: ${INCOME_LABELS[answers.incomeRange]}
- Top spending categories: ${answers.topCategories.join(", ")}
- Savings goal: ${answers.savingsGoal === "custom" ? answers.customSavingsPercent + "%" : SAVINGS_LABELS[answers.savingsGoal]}
- Budget style: ${answers.budgetStyle}

Rules:
1. Generate ONE budget per selected top category. Amounts must sum to no more than 80% of the income range midpoint (the rest covers savings + buffer).
2. If "strict" style, sizes are conservative (10–25% of income for housing, 8–15% for food, etc.).
3. If "flexible" style, sizes are slightly larger (10–30% range tolerated).
4. All budgets are in the user's primary currency.
5. Provide a brief reasoning for each budget (≤ 120 characters).
6. Optionally suggest one global budget as a total monthly cap.
7. Provide a one-sentence summary (≤ 280 characters) of the plan.

Do NOT generate budgets for categories the user did not select.`;
```

### Output schema (Zod)

Already defined in `src/types/onboarding.ts` (see `04-data-model.md`):
```typescript
const onboardingSuggestionsSchema = z.object({
  budgets: z.array(z.object({
    category_name: z.string().max(60),
    amount: z.number().positive(),
    currency: z.enum(["USD", "USDT", "VES", "EUR"]),
    reasoning: z.string().max(120),
  })).min(1).max(8),
  global_budget: z.object({
    amount: z.number().positive(),
    currency: z.enum(["USD", "USDT", "VES", "EUR"]),
  }).optional(),
  summary: z.string().max(280).optional(),
});
```

`generateObject` retries until the schema is satisfied — no manual JSON parsing.

---

## 4. Server Actions

### `generateOnboardingSuggestions(answers)`

```typescript
"use server";
import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { requireUser } from "@/lib/auth/server";
import { onboardingAnswersSchema, onboardingSuggestionsSchema, type OnboardingAnswers, type OnboardingSuggestions } from "@/types/onboarding";
import { buildOnboardingPrompt } from "@/lib/onboarding/prompt";

export async function generateOnboardingSuggestions(
  answers: OnboardingAnswers,
): Promise<{ success: true; suggestions: OnboardingSuggestions } | { success: false; error: string }> {
  await requireUser();

  // Validate input
  const parsed = onboardingAnswersSchema.safeParse(answers);
  if (!parsed.success) {
    return { success: false, error: "Invalid answers" };
  }

  try {
    const { object } = await generateObject({
      model: google("gemini-2.5-flash"),
      schema: onboardingSuggestionsSchema,
      system: buildOnboardingPrompt(parsed.data),
      prompt: "Generate the starter budget plan.",
    });
    return { success: true, suggestions: object };
  } catch (e) {
    console.error("Onboarding generation failed:", e);
    return { success: false, error: "AI generation failed" };
  }
}
```

### `applyOnboardingSuggestions(suggestions)`

```typescript
"use server";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/server";
import { onboardingSuggestionsSchema, type OnboardingSuggestions } from "@/types/onboarding";
import { revalidatePath } from "next/cache";

export async function applyOnboardingSuggestions(suggestions: OnboardingSuggestions) {
  const user = await requireUser();
  const supabase = await createClient();

  const parsed = onboardingSuggestionsSchema.safeParse(suggestions);
  if (!parsed.success) return { success: false, error: "Invalid suggestions" };

  // Map suggestion category names to user's category IDs
  const { data: userCategories } = await supabase
    .from("categories")
    .select("id, name")
    .eq("user_id", user.id);

  const findCategoryId = (name: string) =>
    userCategories?.find((c) => c.name.toLowerCase() === name.toLowerCase())?.id ?? null;

  const today = new Date().toISOString().split("T")[0];

  const inserts = parsed.data.budgets.map((b) => ({
    user_id: user.id,
    category_id: findCategoryId(b.category_name),
    amount: b.amount,
    currency: b.currency,
    period: "monthly",
    start_date: today,
  }));

  // Optional global budget
  if (parsed.data.global_budget) {
    inserts.push({
      user_id: user.id,
      category_id: null,
      amount: parsed.data.global_budget.amount,
      currency: parsed.data.global_budget.currency,
      period: "monthly",
      start_date: today,
    });
  }

  const { error } = await supabase.from("budgets").insert(inserts);
  if (error) return { success: false, error: error.message };

  // Mark complete
  await supabase.auth.updateUser({
    data: { onboarding_complete: true, onboarding_completed_at: new Date().toISOString() },
  });

  revalidatePath("/", "layout");
  return { success: true };
}
```

### `dismissOnboarding()`

```typescript
"use server";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/server";
import { revalidatePath } from "next/cache";

export async function dismissOnboarding() {
  await requireUser();
  const supabase = await createClient();
  await supabase.auth.updateUser({
    data: { onboarding_complete: true, onboarding_completed_at: new Date().toISOString() },
  });
  revalidatePath("/", "layout");
}
```

---

## 5. Guardrails

### Prompt injection mitigation
- All wizard inputs are **structured selections** (radio, multi-select, integer in range). No free-text input fields anywhere in steps 1–5.
- The system prompt builds from validated enums, not from raw user strings.
- Even Step 4 "Custom %" is a `number` validated `1–50`.
- Step 6's editable budget amounts go through Zod validation server-side before insert.

### PII handling
- Income is bracketed (`under_500`, `500_1000`, etc.) — exact income never enters the prompt.
- The prompt never sees the user's name, email, or any identifier.
- Generated suggestions never include or echo any user input back as untrusted strings (Zod schema enforces shape).

### Disclaimer
- No financial-advice disclaimer is required (per user). The output is informational and easily reversible (user accepts/skips/edits).
- Add a small footer line: "Suggestions are starter guidelines — adjust to your situation." Optional.

### AI failure modes
- `generateObject` may throw on schema mismatch after retries. Catch → show error state on Step 6 with "Skip" button.
- Network failure → same error state.
- Generated amounts unrealistic (e.g., 0.01 or 999999) → mitigation: Zod schema's `.positive()` filters zeros/negatives; manual review by user during Step 6 catches outliers.

---

## 6. Layout Wiring

```tsx
// src/app/[locale]/(dashboard)/layout.tsx
import { requireUser } from "@/lib/auth/server";
import { OnboardingModal } from "@/components/onboarding/onboarding-modal";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const showOnboarding = user.user_metadata?.onboarding_complete !== true;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar className="hidden md:flex" />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header user={user} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
      {showOnboarding && <OnboardingModal user={user} />}
    </div>
  );
}
```

---

## 7. Acceptance Criteria

- [ ] Modal appears on first dashboard visit after registration.
- [ ] Modal does not appear after `onboarding_complete = true` is set.
- [ ] All 6 steps reachable; "Next" disabled until step's required input is provided.
- [ ] Step 6 calls `generateOnboardingSuggestions` once on entry; shows skeleton during loading.
- [ ] Suggested budgets render as editable cards.
- [ ] "Apply" inserts budgets into the `budgets` table and sets `onboarding_complete = true`.
- [ ] "Skip" sets `onboarding_complete = true` without inserting budgets.
- [ ] AI call never receives PII or exact income.
- [ ] Failed AI generation shows a recoverable error state with a "Skip" action.
- [ ] TypeScript, lint, build pass.

---

## 8. Future Improvements (not in v1)

- Multi-language AI prompts (English-only v1; the AI naturally uses the system-prompt language).
- Multi-currency budgets (e.g., housing in USD + groceries in VES).
- Re-run onboarding via Settings (manual trigger).
- A/B test wizard vs chat UI.
- Pre-seeding starter expenses based on category selections.
