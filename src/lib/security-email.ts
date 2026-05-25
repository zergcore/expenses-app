import { Resend } from "resend";
import { renderEmailFrame, emailStyles } from "./email-template";

/**
 * Sends a branded security alert email to a user with details about a suspicious login.
 * Includes a signed link to globally terminate all sessions.
 */
export async function sendSecurityAlertEmail(
  email: string,
  reason: string | null,
  ip: string | null,
  country: string | null,
  userAgent: string | null,
  secureToken: string
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const resend = new Resend(apiKey);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const secureUrl = `${baseUrl}/security/confirm?token=${secureToken}`;

  const when = new Date().toUTCString();
  const countryName = country || "Unknown Location";
  const ipApprox = ip || "Unknown IP";
  const device = userAgent || "Unknown Device";

  const emailBody = `
    <h1 style="${emailStyles.h1}">New sign-in to your Fin account</h1>
    <p style="${emailStyles.p}">We noticed a sign-in to your Fin account with the following details:</p>
    <table style="width:100%; border-collapse:collapse; margin: 16px 0; font-size:14px; ${emailStyles.tableReset}">
      <tr><td style="padding:8px 0; color:#888;">When</td><td style="padding:8px 0;">${when}</td></tr>
      <tr><td style="padding:8px 0; color:#888;">From</td><td style="padding:8px 0;">${countryName} · ${ipApprox}</td></tr>
      <tr><td style="padding:8px 0; color:#888;">Device</td><td style="padding:8px 0;">${device}</td></tr>
    </table>
    <p style="${emailStyles.p}">If this was you, no action is needed.</p>
    <p style="${emailStyles.p}">If this wasn't you, click the button below to sign out of every device and secure your account.</p>
    <div style="margin: 24px 0;">
      <a href="${secureUrl}" style="${emailStyles.cta}" class="cta">Secure my account</a>
    </div>
    <p style="${emailStyles.pSmall}">This link is valid for 24 hours.</p>
  `;

  const html = renderEmailFrame({
    title: "New sign-in to your Fin account",
    body: emailBody,
  });

  await resend.emails.send({
    from: "Fin <fin@zergcore.dev>",
    to: email,
    subject: "New sign-in to your Fin account",
    html,
  });
}
