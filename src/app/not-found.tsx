import { redirect } from "next/navigation";
import { defaultLocale } from "@/i18n/config";

// This wildcard fallback redirects the user back to the default locale home/dashboard
export default function GlobalNotFound() {
  redirect(`/${defaultLocale}`);
}
