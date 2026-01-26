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

  // Define public paths that don't require authentication
  const pathname = request.nextUrl.pathname;
  const isPublicPath =
    // Root landing page (/, /en, /es)
    pathname === "/" ||
    pathname === "/en" ||
    pathname === "/es" ||
    // Auth pages
    pathname.startsWith("/login") ||
    pathname.startsWith("/en/login") ||
    pathname.startsWith("/es/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/en/register") ||
    pathname.startsWith("/es/register") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/en/forgot-password") ||
    pathname.startsWith("/es/forgot-password") ||
    pathname.startsWith("/update-password") ||
    pathname.startsWith("/en/update-password") ||
    pathname.startsWith("/es/update-password") ||
    pathname.startsWith("/auth");

  if (!user && !isPublicPath) {
    // no user, potentially respond by redirecting the user to the login page
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Use the verified response
  return supabaseResponse;
}
