const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL ||
  "https://venezuela-expenses-tracker.vercel.app";

const LOGO_URL = `${BASE_URL}/og-logo.png`;
const SITE_HOST = new URL(BASE_URL).host;

// Fin brand palette — matches globals.css light mode tokens
const C = {
  bg: "#fafafa",
  card: "#ffffff",
  border: "#d4d4d4",
  primary: "#8b7355",
  primaryHover: "#7a6449",
  heading: "#1a1a1a",
  body: "#525252",
  muted: "#737373",
  subtle: "#a3a3a3",
} as const;

const FONT = "Arial, 'Helvetica Neue', Helvetica, sans-serif";

const TABLE_RESET =
  'border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt;';

interface EmailFrameOptions {
  title: string;
  body: string;
}

export function renderEmailFrame({ title, body }: EmailFrameOptions): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${title}</title>
<style>
  body { margin: 0; padding: 0; background-color: ${C.bg}; }
  a.cta:hover { background-color: ${C.primaryHover} !important; }
</style>
</head>
<body style="margin: 0; padding: 0; background-color: ${C.bg};">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="${TABLE_RESET} background-color: ${C.bg};">
    <tr>
      <td align="center" style="padding: 32px 16px;">
        <table width="560" cellpadding="0" cellspacing="0" border="0" style="${TABLE_RESET} max-width: 560px; width: 100%; background-color: ${C.card}; border-radius: 8px; border: 1px solid ${C.border};">

          <tr>
            <td style="background-color: ${C.primary}; height: 4px; border-radius: 8px 8px 0 0; font-size: 0; line-height: 0;">&nbsp;</td>
          </tr>

          <tr>
            <td align="center" style="padding: 28px 32px 8px;">
              <img src="${LOGO_URL}" alt="Fin" width="80" height="80" style="display: block; width: 80px; height: 80px; border: 0;" />
            </td>
          </tr>

          <tr>
            <td style="padding: 8px 32px 32px; font-family: ${FONT};">
              ${body}
            </td>
          </tr>

          <tr>
            <td style="padding: 16px 32px 24px; border-top: 1px solid ${C.border}; text-align: center;">
              <p style="font-size: 13px; line-height: 20px; margin: 0 0 4px 0; color: ${C.muted}; font-family: ${FONT};">© Fin · <a href="${BASE_URL}" style="color: ${C.primary}; text-decoration: none;">${SITE_HOST}</a></p>
              <p style="font-size: 12px; line-height: 18px; margin: 0; color: ${C.subtle}; font-family: ${FONT};">If you didn't expect this email, you can safely ignore it.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// Inline style constants for app-code emails (security alert, support)
export const emailStyles = {
  h1: `font-size: 22px; line-height: 28px; margin: 0 0 12px 0; color: ${C.heading}; font-family: ${FONT}; font-weight: 700;`,
  p: `font-size: 15px; line-height: 24px; margin: 0 0 16px 0; color: ${C.body}; font-family: ${FONT};`,
  pSmall: `font-size: 13px; line-height: 20px; margin: 20px 0 0 0; color: ${C.muted}; font-family: ${FONT};`,
  cta: `display: inline-block; background-color: ${C.primary}; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: 700; font-family: ${FONT}; font-size: 15px;`,
  tableReset: TABLE_RESET,
} as const;
