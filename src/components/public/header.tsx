"use client";

import { LocaleSwitcher } from "../layout/locale-switcher";
import { ThemeSwitcher } from "../layout/theme-switcher";
import { Button } from "../ui/button";
import { Sheet, SheetContent, SheetFooter, SheetTrigger } from "../ui/sheet";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { User } from "@supabase/supabase-js";
import { Isotipo } from "../logo/Isotipo";
import Isologo from "../logo/isologo";
import { Menu } from "lucide-react";

export const Header = ({ user }: { user: User | null | undefined }) => {
  const t = useTranslations();
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto flex h-14 md:h-16 items-center justify-between px-4">
        {/* Logo - responsive sizing */}
        <Link href="/" className="flex items-center gap-2">
          <Isotipo width={40} height={40} />
        </Link>

        {/* Desktop Navigation - hidden on mobile */}
        <div className="hidden md:flex items-center gap-2">
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

        {/* Mobile Navigation - hamburger menu */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeSwitcher />
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] flex flex-col">
              {/* Centered content area */}
              <div className="flex-1 flex flex-col items-center justify-center gap-6 px-4">
                {/* Isologo branding */}
                <Isologo className="w-24 h-24" />

                {/* Auth buttons */}
                <nav className="flex flex-col gap-3 w-full">
                  {user ? (
                    <Button asChild className="w-full h-12">
                      <Link href="/dashboard">{t("Auth.dashboard")}</Link>
                    </Button>
                  ) : (
                    <>
                      <Button asChild variant="outline" className="w-full h-12">
                        <Link href="/login">{t("Auth.login")}</Link>
                      </Button>
                      <Button asChild className="w-full h-12">
                        <Link href="/register">{t("Auth.register")}</Link>
                      </Button>
                    </>
                  )}
                </nav>
              </div>

              {/* Footer - Settings (Theme + Language) */}
              <SheetFooter className="border-t pt-4">
                <div className="flex items-center justify-center gap-4 w-full">
                  <LocaleSwitcher />
                  <ThemeSwitcher />
                </div>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};
