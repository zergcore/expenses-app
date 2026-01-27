import { useTranslations } from "next-intl";
import Isologo from "../logo/isologo";

export const HeroSection = () => {
  const t = useTranslations();
  return (
    <section className="container mx-auto pt-26 gap-4 text-center items-center flex flex-col">
      <Isologo width={200} height={200} />
      <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">
        <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
          {t("Landing.hero.title")}
        </span>{" "}
        <br />
        {t("Landing.hero.subtitle")}
      </h1>
      <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
        {t("Landing.hero.description")}
      </p>
    </section>
  );
};
