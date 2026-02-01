"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateCurrencyPreference(formData: FormData) {
  const currency = formData.get("currency") as string;

  if (!currency) {
    return { error: "Currency is required", success: false };
  }

  const supabase = await createClient();

  // Update user metadata in Auth
  const { error } = await supabase.auth.updateUser({
    data: {
      currency,
    },
  });

  if (error) {
    return { error: error.message, success: false };
  }

  revalidatePath("/", "layout");
  return { success: true };
}
