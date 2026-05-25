import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { Database } from "@/types/supabase";

export async function createClient<DatabaseType = Database>() {
  const cookieStore = await cookies();

  return createServerClient<DatabaseType>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    },
  );
}

/**
 * Creates a Supabase client with service role privileges.
 * This bypasses RLS and should only be used for system-level operations
 * like updating exchange rates from public pages.
 *
 * IMPORTANT: Never expose the service role key to the client!
 */
// 3. We add <Database = any> to the service client signature
export function createServiceClient<DatabaseType = Database>() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY environment variable. " +
        "This is required for admin operations.",
    );
  }

  // 4. We pass <Database> down to the standard supabase-js client
  return createSupabaseClient<DatabaseType>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
