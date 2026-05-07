"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

export type NotificationType = "budget_alert" | "system" | "info";

export interface Notification {
  id: string;
  type: NotificationType; // Make sure your DB column type matches this (usually text or a Postgres Enum)
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

// --- Helper Functions ---

/**
 * Ensures the user is authenticated. Throws an error to be caught by the action,
 * or returns the valid user session.
 */
async function requireAuth(supabase: SupabaseClient<Database>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}

// --- Actions ---

export async function getNotifications(
  limit: number = 10,
): Promise<Notification[]> {
  const supabase = await createClient<Database>();

  let user;
  try {
    user = await requireAuth(supabase);
  } catch {
    return []; // Fail silently for unauthenticated UI fetching
  }

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Failed to fetch notifications:", error);
    return [];
  }

  // Because <Database> is passed to createClient, 'data' is inherently typed.
  // We use type assertion only if your local Notification interface differs strictly from the DB Row type.
  return (data as unknown as Notification[]) || [];
}

export async function getUnreadCount(): Promise<number> {
  const supabase = await createClient<Database>();

  let user;
  try {
    user = await requireAuth(supabase);
  } catch {
    return 0;
  }

  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  if (error) {
    console.error("Failed to fetch unread count:", error);
    return 0;
  }

  return count || 0;
}

export async function markAsRead(id: string): Promise<void> {
  const supabase = await createClient<Database>();

  // 🚨 SECURITY FIX: We must fetch the user to prevent IDOR attacks
  const user = await requireAuth(supabase);

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", id)
    .eq("user_id", user.id); // 🚨 SECURITY FIX: Scope the update to the owner

  if (error) throw new Error(error.message);

  revalidatePath("/");
}

export async function markAllAsRead(): Promise<void> {
  const supabase = await createClient<Database>();
  const user = await requireAuth(supabase); // Throws if not authed

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  if (error) throw new Error(error.message);

  revalidatePath("/");
}

// Internal function to create notifications from other server actions (e.g., checkBudgetLimits)
export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
): Promise<void> {
  const supabase = await createClient<Database>();

  // Note: No requireAuth() here because this is called internally by the server,
  // not directly by a client-side user action. The userId is trusted from the caller.

  const { error } = await supabase.from("notifications").insert({
    user_id: userId,
    type,
    title,
    message,
  });

  if (error) {
    console.error("Failed to create notification:", error);
  } else {
    revalidatePath("/");
  }
}
