import { useTranslations } from "next-intl";

export const Footer = () => {
  const t = useTranslations();
  return (
    <footer className="border-t py-8">
      <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
        <p>
          © {new Date().getFullYear()} Fin. {t("Landing.footer.description")}
        </p>
      </div>
    </footer>
  );
};
