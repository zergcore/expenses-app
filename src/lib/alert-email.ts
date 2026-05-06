import { Resend } from "resend";

const DEVELOPER_EMAIL = process.env.DEVELOPER_EMAIL;

export async function sendDolarvzlaAlert(): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || !DEVELOPER_EMAIL) return; // silently skip if not configured

  const resend = new Resend(apiKey);

  await resend.emails.send({
    from: "Fin App <onboarding@resend.dev>",
    to: DEVELOPER_EMAIL,
    subject: "⚠️ dolarvzla.com API key invalid — EUR using fallback",
    html: `
      <p>Hey,</p>
      <p>The <strong>dolarvzla.com</strong> API key is no longer working. The app is currently using a fallback for the EUR/VES rate:</p>
      <blockquote>EUR/VES = (EUR/USD from ECB via Frankfurter) × (USD/VES from dolarapi.com)</blockquote>
      <p>This fallback is accurate but slightly different from the official BCV EUR rate. To restore the exact BCV EUR value, generate a new key at <a href="https://www.dolarvzla.com">dolarvzla.com</a> and update the <code>DOLAR_VZLA_KEY</code> environment variable.</p>
      <p>— Fin App cron</p>
    `,
  });
}
