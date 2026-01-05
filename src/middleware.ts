import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/session";
import createMiddleware from "next-intl/middleware";

const handleI18n = createMiddleware({
  // A list of all locales that are supported
  locales: ["en", "es"],

  // Used when no locale matches
  defaultLocale: "en",
});

export async function middleware(request: NextRequest) {
  // 1. Run next-intl middleware to handle locale detection and redirects
  const response = handleI18n(request);

  // 2. Validate session (auth) while preserving i18n response (cookies/headers)
  return await updateSession(request, response);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - auth/ (Supabase auth callback)
     * - api/ (API routes)
     */
    "/((?!_next/static|_next/image|favicon.ico|auth/|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
