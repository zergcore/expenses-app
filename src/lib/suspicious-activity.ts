import { createServiceClient } from "@/lib/supabase/server";
import { SuspiciousActivityResult } from "@/types/login-events";

export async function detectSuspiciousActivity(
  userId: string,
  ip: string | null,
  country: string | null,
  userAgent: string | null
): Promise<SuspiciousActivityResult> {
  const supabaseAdmin = await createServiceClient();

  // Fetch the last 30 days of login_events for this user_id.
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: events, error } = await supabaseAdmin
    .from("login_events")
    .select("*")
    .eq("user_id", userId)
    .gte("created_at", thirtyDaysAgo.toISOString())
    .order("created_at", { ascending: false });

  if (error || !events) {
    return { isSuspicious: false, reason: null };
  }

  // A. Check New Country:
  // x-vercel-ip-country header value not seen in prior successful sign-ins (last 30 days)
  if (country) {
    const priorSuccessfulSignIns = events.filter(
      (e) => e.event_type === "sign_in" && !e.is_suspicious
    );

    // If there are prior successful sign-ins, and none of them have this country code, trigger suspicious
    if (priorSuccessfulSignIns.length > 0) {
      const seenCountries = new Set(
        priorSuccessfulSignIns.map((e) => e.country_code?.toUpperCase()).filter(Boolean)
      );
      if (!seenCountries.has(country.toUpperCase())) {
        return { isSuspicious: true, reason: "new_country" };
      }
    }
  }

  // B. Check New IP Address:
  if (ip) {
    const priorSuccessfulSignIns = events.filter(
      (e) => e.event_type === "sign_in" && !e.is_suspicious
    );

    if (priorSuccessfulSignIns.length > 0) {
      const seenIPs = new Set(
        priorSuccessfulSignIns.map((e) => e.ip_address).filter(Boolean)
      );
      if (!seenIPs.has(ip)) {
        return { isSuspicious: true, reason: "new_ip" };
      }
    }
  }

  // C. Check New User Agent:
  if (userAgent) {
    const priorSuccessfulSignIns = events.filter(
      (e) => e.event_type === "sign_in" && !e.is_suspicious
    );

    if (priorSuccessfulSignIns.length > 0) {
      const seenUserAgents = new Set(
        priorSuccessfulSignIns.map((e) => e.user_agent).filter(Boolean)
      );
      if (!seenUserAgents.has(userAgent)) {
        return { isSuspicious: true, reason: "new_user_agent" };
      }
    }
  }

  // D. Failed-attempt threshold: 3+ failed attempts in last 15 minutes.
  const fifteenMinutesAgo = new Date();
  fifteenMinutesAgo.setMinutes(fifteenMinutesAgo.getMinutes() - 15);
  
  const failedAttemptsLast15Mins = events.filter(
    (e) => e.event_type === "failed_attempt" && new Date(e.created_at) >= fifteenMinutesAgo
  );

  if (failedAttemptsLast15Mins.length >= 3) {
    return { isSuspicious: true, reason: "failed_attempt_threshold" };
  }

  // E. Password-change spam: 2+ password_change events in last 24 hours.
  const twentyFourHoursAgo = new Date();
  twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

  const passwordChangesLast24Hours = events.filter(
    (e) => e.event_type === "password_change" && new Date(e.created_at) >= twentyFourHoursAgo
  );

  if (passwordChangesLast24Hours.length >= 2) {
    return { isSuspicious: true, reason: "password_change_spam" };
  }

  return { isSuspicious: false, reason: null };
}
