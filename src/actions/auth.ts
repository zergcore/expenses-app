"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { detectSuspiciousActivity } from "@/lib/suspicious-activity";
import { generateSecureToken } from "@/lib/secure-token";
import { sendSecurityAlertEmail } from "@/lib/security-email";

type ActionState = {
  error?: string;
  success?: boolean;
};

export async function signout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function changePassword(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const password = formData.get("password") as string;

  if (!password || password.length < 8) {
    return { error: "Password must be at least 8 characters", success: false };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    return { error: error.message, success: false };
  }

  return { success: true };
}

export async function resetPassword(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = formData.get("email") as string;

  if (!email) {
    return { error: "Email is required", success: false };
  }

  const supabase = await createClient();

  // Determine the base URL dynamically from headers to work in all environments (localhost, preview, prod)
  const headersList = await headers();
  const origin = headersList.get("origin") || ""; // origin usually contains protocol + host
  // Fallback if origin is missing (server-side calls sometimes)
  const baseUrl =
    origin || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${baseUrl}/auth/callback?next=/update-password`,
  });

  if (error) {
    return { error: error.message, success: false };
  }

  return { success: true };
}

export async function signIn(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required", success: false };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: signInError,
  } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for")?.split(",")[0] || null;
  const country = headersList.get("x-vercel-ip-country") || null;
  const userAgent = headersList.get("user-agent") || null;

  const supabaseAdmin = await createServiceClient();

  if (signInError) {
    let userId: string | null = null;
    try {
      const {
        data: { users },
      } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = users.find(
        (u) => u.email?.toLowerCase() === email.toLowerCase(),
      );
      if (existingUser) {
        userId = existingUser.id;
      }
    } catch (e) {
      console.error(String(e));
    }

    if (userId) {
      // Log failed attempt event
      await supabaseAdmin.from("login_events").insert({
        user_id: userId,
        event_type: "failed_attempt",
        ip_address: ip,
        country_code: country,
        user_agent: userAgent,
        is_suspicious: false,
      });

      // Check heuristics on failed attempts
      const { isSuspicious, reason } = await detectSuspiciousActivity(
        userId,
        ip,
        country,
        userAgent,
      );
      if (isSuspicious) {
        const secureToken = generateSecureToken(userId);
        await sendSecurityAlertEmail(
          email,
          reason,
          ip,
          country,
          userAgent,
          secureToken,
        );
      }
    }

    return { error: "Invalid email or password", success: false };
  }

  // On Success:
  const userId = user?.id;

  if (!userId) {
    return { error: "Invalid email or password", success: false };
  }

  // Run heuristics
  const { isSuspicious, reason } = await detectSuspiciousActivity(
    userId,
    ip,
    country,
    userAgent,
  );

  // Log sign_in event
  await supabaseAdmin.from("login_events").insert({
    user_id: userId,
    event_type: "sign_in",
    ip_address: ip,
    country_code: country,
    user_agent: userAgent,
    is_suspicious: isSuspicious,
    reason: reason,
  });

  if (isSuspicious) {
    const secureToken = generateSecureToken(userId);
    await sendSecurityAlertEmail(
      email,
      reason,
      ip,
      country,
      userAgent,
      secureToken,
    );
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}
