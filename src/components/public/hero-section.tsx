import { useTranslations } from "next-intl";
import Isologo from "../logo/isologo";

export const HeroSection = () => {
  const t = useTranslations();
  return (
    <section className="container mx-auto pt-20 md:pt-28 pb-4 md:pb-8 px-4 gap-3 md:gap-4 text-center items-center flex flex-col">
      {/* Logo - responsive sizing */}
      <Isologo className="w-28 h-28 sm:w-36 sm:h-36 md:w-48 md:h-48" />

      <h1 className="text-2xl sm:text-4xl md:text-6xl font-bold tracking-tight mb-2 md:mb-4">
        <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
          {t("Landing.hero.title")}
        </span>{" "}
        <br />
        {t("Landing.hero.subtitle")}
      </h1>

      <p className="hidden md:block text-base md:text-xl text-muted-foreground max-w-2xl mx-auto px-2">
        {t("Landing.hero.description")}
      </p>
    </section>
  );
};
