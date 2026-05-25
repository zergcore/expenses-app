"use server";

import { supportTicketSchema } from "@/types/support";

type State =
  | { status: "idle" }
  | { status: "success" }
  | { status: "error"; message: string }
  | { status: "validation"; fieldErrors: Record<string, string> };

export async function submitSupportTicket(_prev: State, formData: FormData): Promise<State> {
  const parsed = supportTicketSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    subject: formData.get("subject"),
    message: formData.get("message"),
    turnstileToken: formData.get("cf-turnstile-response") || "dummy_token",
    website: formData.get("website") ?? undefined,
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[issue.path.join(".")] = issue.message;
    }
    return { status: "validation", fieldErrors };
  }

  // Honeypot check
  if (parsed.data.website && parsed.data.website.length > 0) {
    return { status: "success" };
  }

  // Simulate short delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return { status: "success" };
}
