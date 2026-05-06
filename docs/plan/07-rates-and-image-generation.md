# Phase 3 — Rates & Image Generation Deep-Dive

Focused document for Changes 3 and 6.

---

## Part A — EUR Rate Sourcing (Change 3)

### Current state

EUR/VES is already flowing end-to-end in the system. The implementation gap is exclusively in the history chart — the data exists in the DB but the query and rendering ignore it.

```
dolarvzla.com API
  └─► fetchBCVRates() → { usd, eur, usdChange, eurChange }
        └─► getExchangeRates() → inserts EUR_VES into exchange_rates table
              └─► getMonthlyRateHistory() ← MISSING EUR_VES HERE
```

### Provider comparison

| Provider | EUR/VES? | Reliability | Auth | Update freq | Cost | Notes |
|---|---|---|---|---|---|---|
| `dolarvzla.com` | ✅ | High | `DOLAR_VZLA_KEY` env var | Hourly | Paid | Primary. Already integrated. Returns `current.eur` directly. |
| `dolarapi.com` | ❌ | Medium | None | Hourly | Free | Fallback. USD only. No EUR endpoint available. |
| ExchangeRate-API | ✅ (EUR/USD) | High | Free tier | Daily | Free | Not USD-VES. Would require EUR/USD × USD/VES cross-rate — introduces compounding error. |
| Manual scraping BCV | ✅ | Low | None | Daily | Free | Fragile. HTML parsing breaks on any layout change. Not recommended. |

**Decision: No new provider needed.** The gap is entirely in the query and TypeScript type, not in data availability.

### Fallback behavior

When `dolarvzla.com` is unavailable and the system falls back to `dolarapi.com`, `fetchBCVRates()` returns `{ usd: X }` with no `eur` field. In this case:
- `bcvData.eur` is `undefined`.
- `getVal("EUR_VES", "BCV", undefined)` falls through to `findLatest("EUR_VES", "BCV")` — returns the last cached value from the DB.
- If the last cached value is within 24h, the stale EUR rate is used. This is acceptable — BCV EUR rates change at most once per business day.
- If there is no cached EUR rate at all (first-run, no data), `eurVes` = 0 and the `EUR / VED` card is omitted from results. The history chart shows `null` for those days (rendered as a gap, then connected via `connectNulls`).

**No code changes needed to the EUR data pipeline — only the query and chart.**

---

## Part B — Image Generation Approach (Change 6)

### Options compared

| Criterion | Client: `html-to-image` | Client: Canvas API | Server: `@vercel/og` / `satori` |
|---|---|---|---|
| **Bundle impact** | ~30KB gzip (lazy-loaded → 0 in initial bundle) | 0KB (built-in) | 0KB client |
| **Font rendering** | Good (uses browser's CSS engine) | Poor (manual font load) | Excellent (custom font files) |
| **CSS / Tailwind** | Works if styles are in DOM | Must be hand-coded | Own layout system (JSX-like but no CSS) |
| **Design fidelity** | High — captures computed styles | Low — pixel-by-pixel coding | High — but requires reimplementing layout |
| **Offline** | ✅ | ✅ | ❌ (HTTP call to `/api/og`) |
| **Share UX** | Native share sheet (client blob) | Native share sheet (canvas toBlob) | Must fetch → download or re-share |
| **SVG logo** | Requires data URI workaround | Same | Works natively |
| **Maintenance** | Low (component = template) | High (imperative drawing) | Medium (separate route, separate layout) |
| **Already in project** | ❌ (new dep) | ✅ (built-in) | ❌ (new dep, needs Vercel edge) |

**Decision: Client-side `html-to-image`.** Reasons:

1. The rates data is already in the React component — no server round-trip.
2. The design can be expressed as a styled React component (maintainable), not as imperative canvas calls.
3. The `navigator.share` interaction is inherently client-side; a server `/api/og` route would require an extra fetch + blob → File conversion anyway.
4. `satori` requires reimplementing the image layout in its own JSX dialect (no CSS) — higher one-time cost, more to maintain.
5. The Canvas API would require hand-coding every font size, color, and position — fragile to design changes.

### `html-to-image` integration details

**Package:** `html-to-image` v1.x  
**Bundle strategy:** Lazy import on button click only:
```typescript
const { toPng } = await import('html-to-image');
```
This ensures the ~30KB chunk is never in the initial page bundle. On first click there is a one-time ~100–200ms network fetch (cached after that).

**Capture call:**
```typescript
const dataUrl = await toPng(templateRef.current, {
  width: dimensions.width,
  height: dimensions.height,
  pixelRatio: 2,          // 2× for crisp display on retina screens
  cacheBust: true,        // prevents stale cached resources
  skipFonts: false,       // capture web fonts
});
```

**Known caveats and mitigations:**

| Caveat | Mitigation |
|---|---|
| SVG `<img>` cross-origin block | Fetch SVG at mount time → convert to `data:image/svg+xml;base64,...` URI → use as `<img src>` |
| Tailwind CSS classes not captured | Use **inline styles only** on the template component |
| Next.js `<Image>` uses a proxy URL | Use plain `<img>` tag in the template with absolute URL or data URI |
| Dark mode colors bleed into image | Explicitly set `backgroundColor` and all colors inline — don't rely on CSS variables |
| `pixelRatio` × dimensions = very large PNG for 9:16 story | Story template: 1080×1920 × 2 = 2160×3840 — acceptable (Instagram supports up to 4K). If file size is a concern, use `pixelRatio: 1.5`. |

### Image template spec

**Three fixed sizes — set as `style={{ width, height }}` on the root div:**

| Platform | `width` | `height` | Ratio |
|---|---|---|---|
| `general` (WhatsApp) | 800px | 800px | 1:1 |
| `twitter` | 1200px | 675px | 16:9 |
| `story` | 1080px | 1920px | 9:16 |

**Visual layout (all platforms share the same template; proportions adapt):**

```
Background: dark gradient (e.g., #0f172a → #1e293b — matches the app's dark theme)

Header row (padding: 32px):
  Left:  Fin isologo (height: 48px for square/landscape; 80px for story)
  Right: Date string — "May 6, 2026" (font: system-ui, white, 16px/22px/28px)

Divider: 1px horizontal rule, white/20% opacity

Rate rows (padding: 32px top, 20px gap between rows):
  For each selected pair:
    Left:  Pair label ("USDT / VES", "USD / VES", "EUR / VES")
           Sub-label: source ("Binance P2P" / "BCV Oficial")
    Right: Rate value ("Bs. 51.40") — bold, 24px/32px/42px
           Trend badge: small colored pill ("▲ +0.5%" green / "▼ -0.3%" red)

Divider

Footer (padding: 24px):
  Left:  "fin.app" — white, 14px
  Right: Tagline from i18n key `share_image_tagline`
```

**Color palette (inline styles, not CSS variables):**
- Background: `linear-gradient(135deg, #0f172a 0%, #1e293b 100%)`
- Text primary: `#f8fafc`
- Text secondary: `#94a3b8`
- USDT green: `#10b981`
- USD blue: `#3b82f6`
- EUR amber: `#f59e0b`
- Trend up: `#22c55e`
- Trend down: `#ef4444`
- Divider: `rgba(255,255,255,0.1)`

### Share flow

```
1. User clicks "Generate & Share"
2. isGenerating = true → button shows spinner + "Generating…"
3. Apply dimensions to template ref (via state → prop → inline style)
4. await nextTick (allow DOM to update with new dimensions)
5. const { toPng } = await import('html-to-image')
6. const dataUrl = await toPng(templateRef.current, { width, height, pixelRatio: 2 })
7. Convert to Blob: fetch(dataUrl) → blob()
8. const file = new File([blob], `rates-${date}.png`, { type: 'image/png' })
9. if (navigator.canShare?.({ files: [file] })):
     await navigator.share({ files: [file], title: 'Fin Rates' })
   else:
     const url = URL.createObjectURL(blob)
     const a = document.createElement('a')
     a.href = url; a.download = `rates-${date}.png`
     a.click()
     URL.revokeObjectURL(url)
10. isGenerating = false
```
