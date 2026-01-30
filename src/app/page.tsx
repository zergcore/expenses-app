import { redirect } from "next/navigation";
import { defaultLocale } from "@/i18n/config";

/**
 * Root page that redirects to the default locale.
 * This is a fallback in case the middleware doesn't handle the redirect.
 */
export default function RootPage() {
  redirect(`/${defaultLocale}`);
}
