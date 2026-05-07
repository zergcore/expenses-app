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

---
---

# Phase 3 — i18n Strings (Batch 2: 13-Item Fix Batch)

> All new strings introduced by the 13-item batch. Add to `messages/en.json` and `messages/es.json`. Strings under existing namespaces extend those namespaces; new namespaces (`Security`, `Onboarding.modal`, `Support`) are net-new.

---

## #1 — Email Branding

Email template content lives in `supabase/templates/*.html` and uses Supabase's template variables (`{{ .ConfirmationURL }}`, `{{ .Email }}`, `{{ .SiteURL }}`). These are **not** managed by `next-intl` — Supabase renders templates in two languages requires either two template files per email or a single bilingual template.

**[ASSUMPTION]** v1 ships English templates only. Spanish templates can be added in a follow-up by configuring per-locale templates if Supabase supports them, or via a custom email-sending Server Action that bypasses Supabase's template engine.

No `messages/*.json` keys for email content in v1.

---

## #2 — Password-Reset Rate Limiting

### `Auth` namespace additions

| Key | EN | ES |
|---|---|---|
| `Auth.resetSent` | `If this email is registered, you'll receive a reset link shortly.` | `Si este correo está registrado, recibirás un enlace en breve.` |
| `Auth.resendIn` | `Resend in {seconds}s` | `Reenviar en {seconds}s` |
| `Auth.resetRequestEmail` | `Email address` | `Correo electrónico` |
| `Auth.resetSubmit` | `Send reset link` | `Enviar enlace` |
| `Auth.resetSubmitting` | `Sending…` | `Enviando…` |

---

## #3 — Duplicate Forgot Password

No new strings. The existing `Auth.forgotPassword` key remains in use.

---

## #4 — Suspicious-Activity Emails

### `Auth` namespace additions (custom sign-in form)

| Key | EN | ES |
|---|---|---|
| `Auth.signIn` | `Sign in` | `Iniciar sesión` |
| `Auth.signingIn` | `Signing in…` | `Iniciando sesión…` |
| `Auth.password` | `Password` | `Contraseña` |
| `Auth.invalidCredentials` | `Invalid email or password.` | `Correo o contraseña incorrectos.` |
| `Auth.signInGenericError` | `Couldn't sign in. Please try again.` | `No se pudo iniciar sesión. Intenta de nuevo.` |

### New `Security` namespace

| Key | EN | ES |
|---|---|---|
| `Security.sessionTerminatedTitle` | `All sessions terminated` | `Todas las sesiones cerradas` |
| `Security.sessionTerminatedDescription` | `For your safety, we've signed you out of every device. Please sign in again.` | `Por tu seguridad, hemos cerrado tu sesión en todos los dispositivos. Inicia sesión de nuevo.` |
| `Security.linkExpired` | `This security link has expired. If your account is still at risk, request a new password reset.` | `Este enlace de seguridad expiró. Si tu cuenta sigue en riesgo, solicita un nuevo restablecimiento.` |

(Email subject lines and body copy live in the email templates, not in `messages/*.json`.)

---

## #5 — OWASP Compliance

No user-facing strings. (Password policy validation messages will reuse Zod's default English error messages; we'll wrap them with translation keys if needed in a future iteration.)

### `Auth` namespace additions (password validation)

| Key | EN | ES |
|---|---|---|
| `Auth.passwordTooShort` | `Password must be at least 8 characters.` | `La contraseña debe tener al menos 8 caracteres.` |
| `Auth.passwordNeedsLettersDigits` | `Password must include letters and numbers.` | `La contraseña debe incluir letras y números.` |
| `Auth.passwordChangeRequiresAuth` | `Please re-enter your current password to make this change.` | `Por favor reingresa tu contraseña actual para hacer este cambio.` |

---

## #6 — Avatar

No new strings.

---

## #7 — Budget Circle

No new strings.

---

## #8 — Expenses Redesign

### `Expenses` namespace additions

| Key | EN | ES |
|---|---|---|
| `Expenses.empty_title` | `No expenses yet` | `Sin gastos aún` |
| `Expenses.empty_description` | `Track your first expense to start building your financial picture.` | `Registra tu primer gasto para comenzar a construir tu panorama financiero.` |
| `Expenses.empty_cta` | `Add your first expense` | `Agrega tu primer gasto` |
| `Expenses.empty_no_filter_match` | `No expenses match your filters.` | `Ningún gasto coincide con tus filtros.` |
| `Expenses.empty_clear_filters` | `Clear filters` | `Limpiar filtros` |
| `Expenses.summary_section` | `Monthly Summary` | `Resumen mensual` |
| `Expenses.activity_section` | `Activity` | `Actividad` |

---

## #9 — Money Math

No new strings (internal refactor).

---

## #10 — Rates Async

| Key | EN | ES |
|---|---|---|
| `Rates.loading_history` | `Loading history…` | `Cargando historial…` |

---

## #11 — Onboarding AI Assistant

### New `Onboarding.modal` namespace

| Key | EN | ES |
|---|---|---|
| `Onboarding.modal.title` | `Let's set you up` | `Configurémonos` |
| `Onboarding.modal.subtitle` | `Six quick questions and Fin will suggest a plan tailored to you.` | `Seis preguntas rápidas y Fin te sugerirá un plan a tu medida.` |
| `Onboarding.modal.step_of` | `Step {current} of {total}` | `Paso {current} de {total}` |
| `Onboarding.modal.next` | `Next` | `Siguiente` |
| `Onboarding.modal.back` | `Back` | `Atrás` |
| `Onboarding.modal.skip` | `Skip for now` | `Omitir por ahora` |
| `Onboarding.modal.generating` | `Generating your plan…` | `Generando tu plan…` |
| `Onboarding.modal.apply` | `Apply suggestions` | `Aplicar sugerencias` |
| `Onboarding.modal.applied_toast` | `Your starter plan is ready.` | `Tu plan inicial está listo.` |
| `Onboarding.modal.error` | `We couldn't generate suggestions right now. You can skip and set things up manually.` | `No pudimos generar sugerencias ahora. Puedes omitir y configurar manualmente.` |
| `Onboarding.modal.step.currency.title` | `Which currency do you mainly use?` | `¿Qué moneda usas principalmente?` |
| `Onboarding.modal.step.currency.description` | `We'll display your budgets in this currency by default.` | `Mostraremos tus presupuestos en esta moneda por defecto.` |
| `Onboarding.modal.step.income.title` | `What's your monthly income range?` | `¿Cuál es tu rango de ingreso mensual?` |
| `Onboarding.modal.step.income.description` | `Used only to size your budgets. Pick a range — exact amount stays private.` | `Solo se usa para dimensionar presupuestos. Elige un rango — la cifra exacta queda privada.` |
| `Onboarding.modal.step.income.under_500` | `Under {currency} 500` | `Menos de {currency} 500` |
| `Onboarding.modal.step.income.500_1000` | `{currency} 500 – 1,000` | `{currency} 500 – 1.000` |
| `Onboarding.modal.step.income.1000_3000` | `{currency} 1,000 – 3,000` | `{currency} 1.000 – 3.000` |
| `Onboarding.modal.step.income.3000_5000` | `{currency} 3,000 – 5,000` | `{currency} 3.000 – 5.000` |
| `Onboarding.modal.step.income.over_5000` | `Over {currency} 5,000` | `Más de {currency} 5.000` |
| `Onboarding.modal.step.categories.title` | `Pick up to 4 spending areas` | `Elige hasta 4 áreas de gasto` |
| `Onboarding.modal.step.categories.description` | `These are the categories you spend on most. We'll create budgets for them.` | `Las categorías donde más gastas. Crearemos presupuestos para ellas.` |
| `Onboarding.modal.step.savings.title` | `How much do you want to save each month?` | `¿Cuánto quieres ahorrar cada mes?` |
| `Onboarding.modal.step.savings.none` | `Not yet — just track spending` | `Aún no — solo rastrear gastos` |
| `Onboarding.modal.step.savings.5` | `5% of income` | `5% del ingreso` |
| `Onboarding.modal.step.savings.10` | `10% of income` | `10% del ingreso` |
| `Onboarding.modal.step.savings.20` | `20% of income` | `20% del ingreso` |
| `Onboarding.modal.step.savings.custom` | `A custom percentage` | `Un porcentaje personalizado` |
| `Onboarding.modal.step.savings.custom_label` | `Savings %` | `% de ahorro` |
| `Onboarding.modal.step.style.title` | `What kind of budgeter are you?` | `¿Qué tipo de presupuestador eres?` |
| `Onboarding.modal.step.style.strict` | `Strict — alert me when I'm close to limits` | `Estricto — avísame cuando me acerque al límite` |
| `Onboarding.modal.step.style.flexible` | `Flexible — guidelines, not hard rules` | `Flexible — guías, no reglas rígidas` |
| `Onboarding.modal.step.review.title` | `Here's your starter plan` | `Este es tu plan inicial` |
| `Onboarding.modal.step.review.description` | `Edit any amount you'd like, then apply.` | `Edita cualquier monto si lo deseas, luego aplica.` |

---

## #12 — Contact/Support Section

### New `Support` namespace

| Key | EN | ES |
|---|---|---|
| `Support.title` | `Contact Support` | `Contactar soporte` |
| `Support.description` | `Have a question or issue? We're here to help.` | `¿Tienes una pregunta o problema? Estamos aquí para ayudar.` |
| `Support.name` | `Name` | `Nombre` |
| `Support.email` | `Email` | `Correo electrónico` |
| `Support.subject` | `Subject` | `Asunto` |
| `Support.message` | `Message` | `Mensaje` |
| `Support.submit` | `Send message` | `Enviar mensaje` |
| `Support.submitting` | `Sending…` | `Enviando…` |
| `Support.success_title` | `Message sent` | `Mensaje enviado` |
| `Support.success_description` | `Your message has been received. We'll reply within 24 hours.` | `Hemos recibido tu mensaje. Responderemos en menos de 24 horas.` |
| `Support.error` | `Something went wrong. Please try again or email us at {email}.` | `Algo salió mal. Por favor intenta de nuevo o escríbenos a {email}.` |
| `Support.turnstile_error` | `Please complete the security check.` | `Por favor completa la verificación de seguridad.` |
| `Support.rate_limit` | `Too many submissions. Please try again in an hour.` | `Demasiadas solicitudes. Intenta de nuevo en una hora.` |
| `Support.send_another` | `Send another message` | `Enviar otro mensaje` |
| `Nav.support` | `Support` | `Soporte` |

---

## #13 — Git Convention

No user-facing strings.

---

## Summary of Batch 2 Keys

| Namespace | New keys | Items |
|---|---|---|
| `Auth.*` | 11 | #2, #4, #5 |
| `Security.*` | 3 | #4 |
| `Expenses.*` | 7 | #8 |
| `Rates.*` | 1 | #10 |
| `Onboarding.modal.*` | 28 | #11 |
| `Support.*` | 14 | #12 |
| `Nav.support` | 1 | #12 |
| **Total Batch 2** | **65** | (each EN + ES = 130 string values) |
