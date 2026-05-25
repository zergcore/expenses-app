import { verifySecureToken } from "@/lib/secure-token";
import { createServiceClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

interface ConfirmPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string | string[] }>;
}

export default async function SecurityConfirmPage({
  params,
  searchParams,
}: ConfirmPageProps) {
  const { locale } = await params;
  const { token: rawToken } = await searchParams;
  const token = Array.isArray(rawToken) ? rawToken[0] : rawToken;

  if (!token) {
    redirect(`/${locale}/login?error=invalid_token`);
  }

  const userId = verifySecureToken(token);

  if (!userId) {
    redirect(`/${locale}/login?error=token_expired`);
  }

  const supabaseAdmin = createServiceClient();
  
  // Terminate all sessions globally for this user
  const { error } = await supabaseAdmin.auth.admin.signOut(userId, "global");

  if (error) {
    redirect(`/${locale}/login?error=termination_failed`);
  }

  // Log the security action in login_events
  await supabaseAdmin.from("login_events").insert({
    user_id: userId,
    event_type: "security_action",
    is_suspicious: false,
    reason: "all_sessions_terminated",
    metadata: { source: "email_secure_link" }
  });

  redirect(`/${locale}/login?secured=true`);
}
