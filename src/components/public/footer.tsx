import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export const Footer = () => {
  const t = useTranslations();
  return (
    <footer className="border-t py-8">
      <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
        <p>
          © {new Date().getFullYear()} Fin. {t("Landing.footer.description")}
        </p>
        <Link href="/support" className="hover:text-foreground transition-colors">
          {t("Nav.support") || "Support"}
        </Link>
      </div>
    </footer>
  );
};
