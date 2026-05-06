# Phase 3 — i18n Strings

All new user-facing strings introduced by the 6 changes. Keyed for `next-intl`. Add to both `messages/en.json` and `messages/es.json`.

No strings are removed. No existing strings are modified.

---

## Change 1 — Logo → Home

No new strings. Navigation only.

---

## Change 2 — Inline Bidirectional Editing

No new strings. All existing `Landing.*` keys cover the calculator UI.

---

## Change 3 — EUR Line in History Chart

Add under the existing `"Rates"` key.

### `messages/en.json`

```json
"Rates": {
  "title": "Rates",
  "description": "See exchange rates.",
  "monthly_trend": "Monthly Rate Trend",
  "usd_official": "USD (BCV Official)",
  "usdt_binance": "USDT (Binance P2P)",
  "eur_bcv": "EUR (BCV Official)"
}
```

### `messages/es.json`

```json
"Rates": {
  "title": "Tasas",
  "description": "Ver tasas de cambio.",
  "monthly_trend": "Tendencia Mensual de Tasas",
  "usd_official": "USD (BCV Oficial)",
  "usdt_binance": "USDT (Binance P2P)",
  "eur_bcv": "EUR (BCV Oficial)"
}
```

---

## Change 4 — Public History Preview + Signup CTA

Add a new `"Landing.history"` sub-key.

### `messages/en.json`

```json
"Landing": {
  "history": {
    "title": "Rate History — Last 30 Days",
    "subtitle": "See how USD, USDT, and EUR have moved against the Bolivar.",
    "sign_in": "Sign In for Full Access",
    "preview_cta": "Sign in to filter by date, track long-term trends, and access the full rate history.",
    "no_data": "No rate data available yet."
  }
}
```

### `messages/es.json`

```json
"Landing": {
  "history": {
    "title": "Historial de Tasas — Últimos 30 días",
    "subtitle": "Mira cómo el USD, USDT y EUR se han movido frente al Bolívar.",
    "sign_in": "Iniciar sesión para acceso completo",
    "preview_cta": "Inicia sesión para filtrar por fecha, seguir tendencias a largo plazo y acceder al historial completo.",
    "no_data": "Aún no hay datos de tasas disponibles."
  }
}
```

---

## Change 5 — Daily (Intraday) Granularity

Add under the existing `"Rates"` key.

### `messages/en.json`

```json
"Rates": {
  "granularity_monthly": "Monthly",
  "granularity_daily": "Daily",
  "daily_trend": "Daily Rate Trend",
  "pick_date": "Pick a date",
  "no_data_for_date": "No rate data for this date."
}
```

### `messages/es.json`

```json
"Rates": {
  "granularity_monthly": "Mensual",
  "granularity_daily": "Diario",
  "daily_trend": "Tendencia Diaria de Tasas",
  "pick_date": "Seleccionar fecha",
  "no_data_for_date": "Sin datos de tasa para esta fecha."
}
```

---

## Change 6 — Shareable Rates Image

Add under the existing `"Rates"` key.

### `messages/en.json`

```json
"Rates": {
  "share_rates": "Share Rates",
  "share_dialog_title": "Share Today's Rates",
  "share_step_rates": "Select rates to include",
  "share_step_platform": "Select sharing format",
  "share_platform_general": "WhatsApp / General",
  "share_platform_general_hint": "Square (1:1)",
  "share_platform_twitter": "Twitter / X",
  "share_platform_twitter_hint": "Landscape (16:9)",
  "share_platform_story": "Instagram Story",
  "share_platform_story_hint": "Portrait (9:16)",
  "share_generate": "Generate & Share",
  "share_generating": "Generating…",
  "share_download": "Download Image",
  "share_error": "Could not generate image. Please try again.",
  "share_select_at_least_one": "Select at least one rate to continue.",
  "share_image_tagline": "Track rates at fin.app"
}
```

### `messages/es.json`

```json
"Rates": {
  "share_rates": "Compartir Tasas",
  "share_dialog_title": "Compartir Tasas de Hoy",
  "share_step_rates": "Selecciona las tasas a incluir",
  "share_step_platform": "Selecciona el formato",
  "share_platform_general": "WhatsApp / General",
  "share_platform_general_hint": "Cuadrado (1:1)",
  "share_platform_twitter": "Twitter / X",
  "share_platform_twitter_hint": "Horizontal (16:9)",
  "share_platform_story": "Historia de Instagram",
  "share_platform_story_hint": "Vertical (9:16)",
  "share_generate": "Generar y Compartir",
  "share_generating": "Generando…",
  "share_download": "Descargar Imagen",
  "share_error": "No se pudo generar la imagen. Inténtalo de nuevo.",
  "share_select_at_least_one": "Selecciona al menos una tasa para continuar.",
  "share_image_tagline": "Sigue las tasas en fin.app"
}
```

---

## Complete Diff Summary

### Keys added to `"Rates"` namespace

| Key | Change |
|---|---|
| `eur_bcv` | 3 |
| `granularity_monthly` | 5 |
| `granularity_daily` | 5 |
| `daily_trend` | 5 |
| `pick_date` | 5 |
| `no_data_for_date` | 5 |
| `share_rates` | 6 |
| `share_dialog_title` | 6 |
| `share_step_rates` | 6 |
| `share_step_platform` | 6 |
| `share_platform_general` | 6 |
| `share_platform_general_hint` | 6 |
| `share_platform_twitter` | 6 |
| `share_platform_twitter_hint` | 6 |
| `share_platform_story` | 6 |
| `share_platform_story_hint` | 6 |
| `share_generate` | 6 |
| `share_generating` | 6 |
| `share_download` | 6 |
| `share_error` | 6 |
| `share_select_at_least_one` | 6 |
| `share_image_tagline` | 6 |

### Keys added to `"Landing"` namespace

| Key | Change |
|---|---|
| `history.title` | 4 |
| `history.subtitle` | 4 |
| `history.sign_in` | 4 |
| `history.preview_cta` | 4 |
| `history.no_data` | 4 |

**Total new keys: 27** (each in both EN and ES = 54 string values).
