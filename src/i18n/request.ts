import { getRequestConfig } from "next-intl/server";
import { headers } from "next/headers";
import { locales, defaultLocale, type Locale } from "./config";

export default getRequestConfig(async () => {
  // Get the locale from the URL path via headers
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";

  // Extract locale from pathname (e.g., /en/dashboard -> en)
  const pathLocale = pathname.split("/")[1];
  const locale = locales.includes(pathLocale as Locale)
    ? pathLocale
    : defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
