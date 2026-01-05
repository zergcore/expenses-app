"use server";

import { createClient } from "@/lib/supabase/server";
import { Category } from "@/lib/categories";
import { revalidatePath } from "next/cache";
import { z } from "zod";

/**
 * Service to fetch categories from the database.
 * No data transformation here, just raw data access.
 */
export async function getCategories(): Promise<Category[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching categories:", error);
    throw new Error(error.message);
  }

  return (data as Category[]) || [];
}

const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  icon: z.string().optional(),
  color: z.string().optional(),
  parent_id: z.string().optional().nullable(),
});

export type ActionState = {
  error?: string;
  errors?: Record<string, string[]>;
  success?: boolean;
};

export async function createCategory(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient();

  const rawData = {
    name: formData.get("name"),
    icon: formData.get("icon"),
    color: formData.get("color"),
    parent_id:
      formData.get("parent_id") === "root"
        ? null
        : formData.get("parent_id") || null,
  };

  const validated = categorySchema.safeParse(rawData);

  if (!validated.success) {
    return {
      error: "Invalid input",
      errors: validated.error.flatten().fieldErrors,
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const { error } = await supabase.from("categories").insert({
    user_id: user.id,
    name: validated.data.name,
    icon: validated.data.icon,
    color: validated.data.color,
    parent_id: validated.data.parent_id,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/categories");
  return { success: true };
}

export async function deleteCategory(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("categories").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/categories");
}
