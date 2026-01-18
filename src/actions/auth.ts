"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

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
  formData: FormData
): Promise<ActionState> {
  const password = formData.get("password") as string;

  if (!password || password.length < 6) {
    return { error: "Password must be at least 6 characters", success: false };
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
  formData: FormData
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
