"use client";

import { usePathname, useRouter } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe } from "lucide-react";
import { locales, type Locale } from "@/i18n/config";
import { useTransition } from "react";

const localeNames: Record<Locale, string> = {
  en: "English",
  es: "Español",
};

const localeFlags: Record<Locale, string> = {
  en: "🇺🇸",
  es: "🇪🇸",
};

// Helper function to set cookies (extracted to avoid React compiler lint issues)
function setCookie(name: string, value: string, maxAge: number) {
  document.cookie = `${name}=${value}; path=/; max-age=${maxAge}`;
}

export function LocaleSwitcher() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const handleLocaleChange = (newLocale: Locale) => {
    // Set cookie to remember user's manual locale preference
    // This overrides IP-based detection on future visits
    setCookie("NEXT_LOCALE", newLocale, 60 * 60 * 24 * 365);

    startTransition(() => {
      router.replace(pathname, { locale: newLocale });
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          disabled={isPending}
        >
          <Globe className="h-5 w-5" />
          <span className="sr-only">Change language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((l) => (
          <DropdownMenuItem
            key={l}
            onClick={() => handleLocaleChange(l)}
            className={`flex items-center gap-2 cursor-pointer ${
              l === locale ? "bg-accent" : ""
            }`}
          >
            <span className="text-lg">{localeFlags[l]}</span>
            <span>{localeNames[l]}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
