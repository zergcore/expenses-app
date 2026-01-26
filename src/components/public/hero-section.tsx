import { useTranslations } from "next-intl";

export const HeroSection = () => {
  const t = useTranslations();
  return (
    <section className="container mx-auto px-4 pt-32 pb-16 text-center">
      <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">
        <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
          {t("Landing.hero.title")}
        </span>{" "}
        <br />
        {t("Landing.hero.subtitle")}
      </h1>
      <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
        {t("Landing.hero.description")}
      </p>
    </section>
  );
};
