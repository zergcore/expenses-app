import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { locales, type Locale } from "@/i18n/config";

// Base URL for the site - use environment variable or default
const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL ||
  "https://venezuela-expenses-tracker.vercel.app";

// Locale to OpenGraph locale mapping
const ogLocaleMap: Record<Locale, string> = {
  en: "en_US",
  es: "es_ES",
};

type MetadataOptions = {
  /** Override the page title (uses Metadata.title by default) */
  pageTitle?: string;
  /** Override the page description */
  pageDescription?: string;
  /** Path for the page (without locale prefix), e.g., "/dashboard" */
  path?: string;
  /** Custom OG image path (relative to public folder) */
  ogImage?: string;
  /** Additional keywords to add to the default ones */
  additionalKeywords?: string[];
  /** Disable indexing for this page */
  noIndex?: boolean;
};

/**
 * Generate comprehensive SEO metadata for a page
 *
 * @param locale - The current locale (en, es)
 * @param options - Optional overrides for specific pages
 * @returns Complete Metadata object for Next.js
 */
export async function getLocalizedMetadata(
  locale: string,
  options: MetadataOptions = {},
): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "Metadata" });

  const {
    pageTitle,
    pageDescription,
    path = "",
    ogImage = "/og-image.png",
    additionalKeywords = [],
    noIndex = false,
  } = options;

  // Build the canonical URL
  const canonicalUrl = `${BASE_URL}/${locale}${path}`;

  // Get base keywords and merge with additional ones
  const baseKeywords = t("keywords")
    .split(",")
    .map((k: string) => k.trim());
  const allKeywords = [...baseKeywords, ...additionalKeywords];

  // Build language alternates for hreflang
  const languages: Record<string, string> = {};
  for (const loc of locales) {
    languages[loc] = `${BASE_URL}/${loc}${path}`;
  }
  languages["x-default"] = `${BASE_URL}/en${path}`;

  // Determine final title and description
  const siteTitle = t("title");
  const ogTitle = pageTitle ? `${pageTitle} | ${siteTitle}` : siteTitle;
  const description = pageDescription || t("description");

  return {
    title: {
      default: siteTitle,
      template: `%s | ${siteTitle}`,
    },
    description,
    keywords: allKeywords,
    authors: [{ name: t("author") }],
    creator: t("author"),
    publisher: t("author"),

    // Robots / Indexing
    robots: noIndex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-video-preview": -1,
            "max-image-preview": "large",
            "max-snippet": -1,
          },
        },

    // Canonical and language alternates
    alternates: {
      canonical: canonicalUrl,
      languages,
    },

    // Open Graph (Facebook, LinkedIn, WhatsApp)
    openGraph: {
      type: "website",
      locale: ogLocaleMap[locale as Locale] || "en_US",
      alternateLocale: locales
        .filter((l) => l !== locale)
        .map((l) => ogLocaleMap[l]),
      url: canonicalUrl,
      siteName: siteTitle,
      title: ogTitle,
      description,
      images: [
        {
          url: `${BASE_URL}${ogImage}`,
          width: 1200,
          height: 630,
          alt: siteTitle,
        },
      ],
    },

    // Twitter Card
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description,
      images: [`${BASE_URL}${ogImage}`],
      creator: t("twitterHandle"),
    },

    // App-specific
    applicationName: siteTitle,
    category: t("category"),

    // Icons (assuming you have these in /public)
    icons: {
      icon: "/favicon.ico",
      shortcut: "/favicon-16x16.png",
      apple: "/apple-touch-icon.png",
    },

    // Manifest for PWA
    manifest: "/site.webmanifest",
  };
}

/**
 * Generate page-specific metadata that inherits from the base metadata
 * Use this in individual page.tsx files
 */
export async function getPageMetadata(
  locale: string,
  namespace: string,
  path: string,
  options: Omit<MetadataOptions, "path"> = {},
): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace });

  return getLocalizedMetadata(locale, {
    pageTitle: t("title"),
    pageDescription: t("description"),
    path,
    ...options,
  });
}
