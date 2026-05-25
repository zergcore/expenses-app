import { createBrowserClient } from "@supabase/ssr";
import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase"; // 1. Import your schema here

// 2. Type the singleton perfectly using your schema. No 'any' needed!
let client: SupabaseClient<Database> | undefined;

// 3. Remove the generic from the function
export const createClient = () => {
  // 4. No more 'as' casting required
  if (client) return client;

  client = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        secure: process.env.NODE_ENV === "production",
      },
    },
  );

  return client;
};
