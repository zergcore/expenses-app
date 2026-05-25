import { useTranslations } from "next-intl";
import Isologo from "../logo/isologo";
import { User } from "@supabase/supabase-js";
import { Button } from "../ui/button";
import { Link } from "@/i18n/navigation";

interface HeroSectionProps {
  user?: User | null;
}

export const HeroSection = ({ user }: HeroSectionProps) => {
  const t = useTranslations();

  return (
    <section className="container mx-auto pt-20 md:pt-28 pb-4 md:pb-8 px-4 gap-3 md:gap-4 text-center items-center flex flex-col">
      {/* Logo - responsive sizing */}
      <Isologo className="w-28 h-28 sm:w-36 sm:h-36 md:w-48 md:h-48" />

      <h1 className="text-2xl sm:text-4xl md:text-6xl font-bold tracking-tight mb-2 md:mb-4">
        <span className="bg-linear-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
          {t("Landing.hero.title")}
        </span>{" "}
        <br />
        {t("Landing.hero.subtitle")}
      </h1>

      <p className="hidden md:block text-base md:text-xl text-muted-foreground max-w-2xl mx-auto px-2">
        {t("Landing.hero.description")}
      </p>

      {user && (
        <div className="mt-6 w-full max-w-xl mx-auto rounded-2xl border border-primary/20 bg-card/40 p-6 backdrop-blur-md shadow-xl transition-all duration-300 hover:shadow-primary/5 hover:border-primary/30 hover:scale-[1.01] relative overflow-hidden group">
          {/* Glow effect */}
          <div className="absolute -inset-px bg-linear-to-r from-primary/10 to-primary/0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-lg font-semibold text-foreground">
                {t("Landing.session_banner.welcome")}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {t("Landing.session_banner.message", {
                  email: user.email ?? "",
                })}
              </p>
            </div>
            <Button
              asChild
              className="shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-shadow duration-300 shrink-0 w-full sm:w-auto"
            >
              <Link href="/dashboard">
                {t("Landing.session_banner.button")}
              </Link>
            </Button>
          </div>
        </div>
      )}
    </section>
  );
};
