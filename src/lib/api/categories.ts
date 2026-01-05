import { createClient } from "@/lib/supabase/server";
import { Category } from "@/lib/categories";

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
    // In production, we might want to throw a specific error or return empty array with logging
    throw new Error(error.message);
  }

  return (data as Category[]) || [];
}
