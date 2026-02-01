"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const fullName = formData.get("fullName") as string;
  const avatarUrl = formData.get("avatarUrl") as string;

  const updates: { data: { full_name?: string; avatar_url?: string } } = {
    data: {},
  };

  if (fullName) updates.data.full_name = fullName;
  if (avatarUrl) updates.data.avatar_url = avatarUrl;

  const { error } = await supabase.auth.updateUser(updates);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/", "layout");
  return { success: true };
}
