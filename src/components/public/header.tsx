import { LocaleSwitcher } from "../layout/locale-switcher";
import { ThemeSwitcher } from "../layout/theme-switcher";
import { Button } from "../ui/button";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { User } from "@supabase/supabase-js";

export const Header = ({ user }: { user: User | null | undefined }) => {
  const t = useTranslations();
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Fin
          </span>
        </div>
        <div className="flex items-center gap-2">
          <LocaleSwitcher />
          <ThemeSwitcher />
          {user ? (
            <Button asChild variant="ghost">
              <Link href="/dashboard">{t("Auth.dashboard")}</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost">
                <Link href="/login">{t("Auth.login")}</Link>
              </Button>
              <Button asChild>
                <Link href="/register">{t("Auth.register")}</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
