# Phase 3 — Expenses View Redesign (Batch 2)

> Item #8. Surface the orphaned `ExpensesSidebar`. Restructure into a two-column layout. Replace the lifeless empty state. Establish a clear visual hierarchy. Aim: minimalist + information-rich.

---

## 1. Diagnosis: "AI-Generated" Tells Currently Present

| Tell | Where | Why it reads as templated |
|---|---|---|
| 4 KPI cards, identical structure (icon chip + label + number) | `kpi-header.tsx` | Reads as "model output, not designer output" — no card has more weight than another |
| Default shadcn `<Card>` paddings everywhere | All cards | Identical rhythm signals "ChatGPT generated" |
| Empty state is `h-24 text-center` plain text | `data-table.tsx:217` | No illustration, no CTA, no warmth |
| `ExpensesSidebar` (rich analytical content) is built but not rendered | Page layout | The "right tool for the job" is missing from the page |
| Footer: 8 stacked numbers in identical type size | `data-table.tsx:228–276` | Visual flood; user can't pick the dominant currency |
| No hero number on the page | Page | "What's the most important thing here?" — the answer is unclear |
| Generic outline-button filter pills | `data-table.tsx:127` | No personality; could be from any starter template |

---

## 2. Design Principles

1. **One number wins per region.** Inside the KPI strip, the budget summary is the dominant card; the others are quiet companions. Inside the sidebar, the percentage of budget used is the hero. Inside the table footer, USD total is the dominant figure.
2. **Restrained color = signal.** Color is reserved for state changes (over budget = red, on track = green, alert = amber). Nothing is colored "for decoration."
3. **Whitespace as hierarchy.** More space around the dominant elements. Less space inside dense regions (the data table itself stays compact).
4. **Empty states as invitations.** Replace blank/lifeless empty states with an icon + title + sub-copy + CTA.
5. **Surface, don't add.** The chart card, daily spending insight, projection card already exist in `ExpensesSidebar`. Wire them in. No new analytical features for this redesign.
6. **Mobile parity, not mobile compromise.** Sidebar content collapses below the table on mobile, not hidden — these analytics matter on phones.

---

## 3. Wireframes

### Desktop (≥ lg breakpoint)

```
╭─────────────────────────────────────────────────────────────────────╮
│  Expenses                                                            │
│  ‹ April 2026 ›                                          [Export ⇣]  │
│                                              [Add Expense] [Scan ⇡] │
├─────────────────────────────────────────┬───────────────────────────┤
│                                         │                           │
│  ┌──── Budget Summary ────────┐         │  ┌─── Budget Overview ──┐ │
│  │      ◯ 68%                 │         │  │       ◯ 68%          │ │
│  │   $340 / $500              │         │  │   On track           │ │
│  │   $160 left for the month  │         │  └──────────────────────┘ │
│  └────────────────────────────┘         │  ┌─── Daily Spending ───┐ │
│                                         │  │  $12.40 / $16.67     │ │
│  ┌─Daily Avg─┐ ┌─Projection─┐ ┌─Out──┐  │  │  ↑ on track          │ │
│  │ $12.40    │ │ $408       │ │ $24  │  │  └──────────────────────┘ │
│  │ /$16.67   │ │ projected  │ │ unbg │  │  ┌─── EOM Projection ───┐ │
│  └───────────┘ └────────────┘ └──────┘  │  │  $408                │ │
│                                         │  │  by month end        │ │
│  ╭─ Search expenses ──────────╮         │  └──────────────────────┘ │
│  │ 🔍                         │         │                           │
│  ╰────────────────────────────╯         │                           │
│  [ALL] [VES] [USD] [USDT] [EUR]         │                           │
│  [All cats] [Food] [Transport] [Shop]   │                           │
│                                         │                           │
│  ┌─Date──Description──Cat──Amount───┐   │                           │
│  │ May 6  Lunch        Food   $8.50 │   │                           │
│  │ May 5  Bus          Trans  $1.20 │   │                           │
│  │ ...                              │   │                           │
│  └──────────────────────────────────┘   │                           │
│  ─── Total spent ──── $340.00 USD ──    │                           │
│   (other currencies)  ₿ 12,500 / 6.8 USDT / 312 EUR                 │
│  [‹ Prev]                    [Next ›]   │                           │
╰─────────────────────────────────────────┴───────────────────────────╯
```

### Mobile (< md)

```
╭───────────────────────────────╮
│  Expenses                     │
│  ‹ April 2026 ›        [⋯]    │
│                               │
│  [Export]  [Add]  [Scan]      │
├───────────────────────────────┤
│  ╭─── Budget Summary ───╮     │
│  │   ◯ 68%               │     │
│  │  $340 / $500          │     │
│  │  $160 left            │     │
│  ╰───────────────────────╯     │
│                               │
│  [Daily $12.40][Proj $408]    │
│  [Unbgt $24]                  │
├───────────────────────────────┤
│  Search ︰  Filters ▾          │
│  [Currency pills]              │
│  [Category pills]              │
│  ─────────────────────────    │
│  May 6 · Food                  │
│    Lunch              $8.50   │
│  May 5 · Transport             │
│    Bus                $1.20   │
│  ...                          │
├───────────────────────────────┤
│  ── Insights ──                │
│  ╭─Budget Overview─────╮      │
│  │  ◯ 68% · On track    │      │
│  ╰─────────────────────╯      │
│  ╭─Daily────────────────╮     │
│  │ $12.40 · on track    │     │
│  ╰─────────────────────╯      │
│  ╭─Projection──────────╮      │
│  │ $408 · by month end │      │
│  ╰─────────────────────╯      │
╰───────────────────────────────╯
```

### Empty state

```
╭───────────────────────────────────────╮
│  Expenses                              │
│  ‹ May 2026 ›        [Add Expense]    │
│                                       │
│         💸                             │
│   No expenses yet this month          │
│   Track your first expense to start   │
│   building your financial picture.    │
│                                       │
│        [+ Add your first expense]     │
│                                       │
╰───────────────────────────────────────╯
```

---

## 4. KPI Hierarchy Restructure

**Before:** 4 cards in a `grid-cols-2 lg:grid-cols-4` — all equal weight.

**After:** Budget Summary card spans 2 columns on `lg+`; the other three are slimmer companions in a `grid-cols-3` row below it.

```
lg breakpoint
┌─────────────────────────────────┐
│  Budget Summary (dominant)       │
│  ◯ 68% · $340 / $500             │
│  Days passed 5/31  ▰▰▱▱▱▱▱▱     │
└─────────────────────────────────┘
┌──── Daily Avg ────┬─── Projection ───┬── Unbudgeted ───┐
│ $12.40 / $16.67   │ $408 by month end │ $24 to assign   │
└───────────────────┴──────────────────┴─────────────────┘
```

The dominant card uses larger numbers (text-3xl), more padding, an inline progress bar for days. The secondary row uses smaller numbers (text-xl), tighter padding, no progress bars.

---

## 5. Sidebar Composition (already built)

`ExpensesSidebar` already contains:
- `ChartCard` — large donut (after #7 fix)
- `LegendExpenseChart` — color legend for the donut
- `DailySpendingInsight` — daily burn rate
- `UnbudgetedExpensesInfo` (conditional)
- A separate Card with EOM projection

These are wired in unchanged for the redesign. The only fixes:
- `ChartCard` parent should not have `overflow-hidden` (Item #7).
- `ExpensesSidebar` already has `lg:sticky lg:top-4` — perfect for desktop scroll behavior.

---

## 6. Empty State Component

### `src/components/expenses/expenses-empty-state.tsx`

```tsx
import { Button } from "@/components/ui/button";
import { ReceiptText, Plus } from "lucide-react";
import { useTranslations } from "next-intl";

interface Props {
  variant: "no_expenses" | "no_filter_match";
  onAddExpense?: () => void;
  onClearFilters?: () => void;
}

export function ExpensesEmptyState({ variant, onAddExpense, onClearFilters }: Props) {
  const t = useTranslations("Expenses");

  if (variant === "no_filter_match") {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <ReceiptText className="h-12 w-12 text-muted-foreground/50 mb-3" strokeWidth={1.25} />
        <h3 className="text-base font-medium text-foreground mb-1">{t("empty_no_filter_match")}</h3>
        <Button variant="outline" size="sm" className="mt-4" onClick={onClearFilters}>
          {t("empty_clear_filters")}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="h-16 w-16 rounded-full bg-muted/40 flex items-center justify-center mb-4">
        <ReceiptText className="h-8 w-8 text-muted-foreground" strokeWidth={1.5} />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">{t("empty_title")}</h3>
      <p className="text-sm text-muted-foreground max-w-xs mb-6">{t("empty_description")}</p>
      {onAddExpense && (
        <Button onClick={onAddExpense}>
          <Plus className="h-4 w-4 mr-1" />
          {t("empty_cta")}
        </Button>
      )}
    </div>
  );
}
```

Two variants:
- `no_expenses` — no records exist for the month.
- `no_filter_match` — records exist but filters hide them all (more common in normal use; offer a clear-filters action).

---

## 7. Footer Restructure (DataTable)

**Before:** 8 stacked numbers in identical font size.

**After:** Two compact rows, USD prominent, others muted:

```
─────────────────────────────────────────────────────────────────────
  Total spent          $340.00 USD
                       Bs 17,418  ·  338 USDT  ·  €312
─────────────────────────────────────────────────────────────────────
```

- USD total in `text-base font-semibold`.
- Other currencies in `text-xs text-muted-foreground` separated by `·`.
- Single row "Spent per currency" hidden by default; toggle revealing it via a "Details" disclosure.

---

## 8. Filter Pill Refinement

Current pills are `Button variant={"default"|"outline"}`. After:
- Selected pill: `bg-primary text-primary-foreground` — keep.
- Unselected pill: `bg-secondary/50 hover:bg-secondary` — softer, less "outline-button" feel.
- Currency pills get the `CURRENCY_CONFIG[c].icon` already passed in (no change to logic; visual cleanup only).

---

## 9. Component Changes (recap from `06-component-changes.md`)

| Path | Op | Notes |
|---|---|---|
| `src/app/[locale]/(dashboard)/expenses/page.tsx` | M | Add `<ExpensesSidebar>` to a 2-col grid |
| `src/components/expenses/kpi-header.tsx` | M | Hierarchy + #7 overflow fix |
| `src/components/expenses/expenses-empty-state.tsx` | C | New |
| `src/components/expenses/data-table.tsx` | M | Empty state swap, footer restructure |
| `src/components/expenses/expense-chart/chart-card.tsx` | M | Confirm overflow fix |

---

## 10. Acceptance Criteria

- [ ] Desktop `lg+`: 2-column layout (table left, sidebar right). Sidebar sticky on scroll.
- [ ] Mobile/tablet: single column. Sidebar content moves below the table.
- [ ] Budget Summary KPI card is visually larger/distinct from the other three.
- [ ] No expenses: empty state with icon, copy, "Add your first expense" CTA.
- [ ] Filtered to no matches: separate empty state with "Clear filters" action.
- [ ] Footer: USD total dominant; other currencies muted secondary.
- [ ] All previously-orphaned `ExpensesSidebar` content (donut, daily insight, projection) renders correctly.
- [ ] Donut chart no longer clipped by `overflow-hidden` (covered by Item #7).
- [ ] Lighthouse Layout Shift score doesn't regress.
- [ ] TypeScript, lint, build pass.

---

## 11. Out of Scope (deferred)

- New analytical content beyond what `ExpensesSidebar` already provides.
- Animation / micro-interactions.
- Sparkline in the table column.
- Per-row category color stripes.
- Quick-edit inline.

These are good follow-ups but not part of this batch.
