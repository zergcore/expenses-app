const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL ||
  "https://venezuela-expenses-tracker.vercel.app";

const LOGO_URL = `${BASE_URL}/og-logo.png`;
const SITE_HOST = new URL(BASE_URL).host;

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
  body { margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1a1a1a; }
  a.cta:hover { background-color: #333333 !important; }
</style>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1a1a1a;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 32px 16px;">
        <table width="560" cellpadding="0" cellspacing="0" border="0" style="max-width: 560px; width: 100%; background-color: #ffffff; border-radius: 12px;">
          <tr>
            <td align="center" style="padding: 32px 32px 0;">
              <img src="${LOGO_URL}" alt="Fin" width="48" height="48" style="display: block; width: 48px; height: 48px; border: 0;" />
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 32px 32px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
              ${body}
            </td>
          </tr>
          <tr>
            <td style="padding: 16px 32px 24px; border-top: 1px solid #f0f0f0; font-size: 13px; color: #888888; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
              <p style="margin: 0 0 8px;">© Fin · <a href="${BASE_URL}" style="color: #888888; text-decoration: underline;">${SITE_HOST}</a></p>
              <p style="margin: 0;">If you didn't expect this email, you can safely ignore it.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export const emailStyles = {
  h1: 'font-size: 22px; line-height: 1.3; margin: 16px 0 12px; color: #1a1a1a; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', sans-serif;',
  p: 'font-size: 15px; line-height: 1.6; margin: 0 0 16px; color: #404040; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', sans-serif;',
  pSmall: 'font-size: 13px; line-height: 1.6; margin: 0 0 16px; color: #888888; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', sans-serif;',
  cta: 'display: inline-block; background-color: #1a1a1a; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; margin: 16px 0; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', sans-serif; font-size: 15px;',
} as const;
