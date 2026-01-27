import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/session";
import createMiddleware from "next-intl/middleware";
import { locales, defaultLocale, type Locale } from "@/i18n/config";

// Spanish-speaking countries (ISO 3166-1 alpha-2 codes)
const spanishSpeakingCountries = [
  "VE", // Venezuela
  "ES", // Spain
  "MX", // Mexico
  "AR", // Argentina
  "CO", // Colombia
  "CL", // Chile
  "PE", // Peru
  "EC", // Ecuador
  "GT", // Guatemala
  "CU", // Cuba
  "BO", // Bolivia
  "DO", // Dominican Republic
  "HN", // Honduras
  "PY", // Paraguay
  "SV", // El Salvador
  "NI", // Nicaragua
  "CR", // Costa Rica
  "PA", // Panama
  "UY", // Uruguay
  "PR", // Puerto Rico
  "GQ", // Equatorial Guinea
];

/**
 * Detect the preferred locale based on the user's country (from Vercel's IP geolocation)
 */
function getLocaleFromCountry(countryCode: string | null): Locale {
  if (!countryCode) return defaultLocale;

  if (spanishSpeakingCountries.includes(countryCode.toUpperCase())) {
    return "es";
  }

  return defaultLocale;
}

/**
 * Check if the pathname already has a locale prefix
 */
function pathnameHasLocale(pathname: string): boolean {
  return locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`,
  );
}

const handleI18n = createMiddleware({
  // A list of all locales that are supported
  locales,

  // Used when no locale matches
  defaultLocale,

  // Don't use the Accept-Language header - we use IP-based detection instead
  localeDetection: false,
});

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip locale detection if pathname already has a locale
  if (!pathnameHasLocale(pathname)) {
    // Check if user has a manually-set locale preference (from locale switcher)
    const localeCookie = request.cookies.get("NEXT_LOCALE")?.value;

    let detectedLocale: Locale;

    if (localeCookie && locales.includes(localeCookie as Locale)) {
      // User has manually selected a locale - respect their choice
      detectedLocale = localeCookie as Locale;
    } else {
      // Detect locale from Vercel's IP geolocation header
      const countryCode = request.headers.get("x-vercel-ip-country");
      detectedLocale = getLocaleFromCountry(countryCode);
    }

    // Redirect to the locale-prefixed path
    const url = request.nextUrl.clone();
    url.pathname = `/${detectedLocale}${pathname}`;

    const response = NextResponse.redirect(url);

    // Set the locale cookie so it persists for the session
    response.cookies.set("NEXT_LOCALE", detectedLocale, {
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: "/",
    });

    // Set x-pathname header for locale detection in server components
    response.headers.set("x-pathname", url.pathname);

    // Validate session (auth) while preserving the response
    return await updateSession(request, response);
  }

  // 1. Run next-intl middleware to handle locale detection and redirects
  const response = handleI18n(request);

  // 2. Set x-pathname header for locale detection in server components
  response.headers.set("x-pathname", request.nextUrl.pathname);

  // 3. Validate session (auth) while preserving i18n response (cookies/headers)
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
