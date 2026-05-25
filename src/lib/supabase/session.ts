import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function updateSession(
  request: NextRequest,
  response?: NextResponse,
) {
  let supabaseResponse =
    response ||
    NextResponse.next({
      request,
    });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  
  // Define protected paths (dashboard routes)
  const protectedPaths = [
    "dashboard",
    "budgets",
    "calculator",
    "categories",
    "expenses",
    "notifications",
    "profile",
    "rates",
    "recurring",
    "settings",
  ];

  // Helper to determine if path is protected
  const isProtectedPath = (() => {
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length === 0) return false;
    
    // Check if the first segment is a locale; if so, inspect the second segment
    const firstSegment = segments[0];
    const isLocale = firstSegment === "en" || firstSegment === "es";
    const targetSegment = isLocale ? segments[1] : firstSegment;
    
    return targetSegment ? protectedPaths.includes(targetSegment) : false;
  })();

  if (!user && isProtectedPath) {
    // no user and trying to access a protected dashboard route, redirect to login
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Use the verified response
  return supabaseResponse;
}
