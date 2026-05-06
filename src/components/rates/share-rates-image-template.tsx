
"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import type { RateData } from "@/actions/rates";

export type SharePlatform = "general" | "twitter" | "story";
export type SharePair = "USDT_VES" | "USD_VES" | "EUR_VES";

export const PLATFORM_DIMENSIONS: Record<SharePlatform, { width: number; height: number }> = {
  general: { width: 800, height: 800 },
  twitter: { width: 1200, height: 675 },
  story: { width: 1080, height: 1920 },
};

const PAIR_LABELS: Record<SharePair, { name: string; source: string; color: string }> = {
  USDT_VES: { name: "USDT / VES", source: "Binance P2P", color: "#10b981" },
  USD_VES: { name: "USD / VES", source: "BCV Oficial", color: "#3b82f6" },
  EUR_VES: { name: "EUR / VES", source: "BCV Oficial", color: "#f59e0b" },
};

const RATE_PAIR_MAP: Record<SharePair, string> = {
  USDT_VES: "USDT / USD",
  USD_VES: "USD / VED",
  EUR_VES: "EUR / VED",
};

interface ShareRatesImageTemplateProps {
  rates: RateData[];
  selectedPairs: Set<SharePair>;
  platform: SharePlatform;
  templateRef: React.RefObject<HTMLDivElement | null>;
  tagline: string;
}

export function ShareRatesImageTemplate({
  rates,
  selectedPairs,
  platform,
  templateRef,
  tagline,
}: ShareRatesImageTemplateProps) {
  const [logoDataUrl, setLogoDataUrl] = useState<string>("");
  const dims = PLATFORM_DIMENSIONS[platform];
  const isStory = platform === "story";
  const isLandscape = platform === "twitter";

  useEffect(() => {
    fetch("/isologo.svg")
      .then((r) => r.text())
      .then((svg) => {
        const b64 = btoa(unescape(encodeURIComponent(svg)));
        setLogoDataUrl(`data:image/svg+xml;base64,${b64}`);
      })
      .catch(() => { });
  }, []);

  const logoHeight = isStory ? 80 : 48;
  const dateFontSize = isStory ? 28 : isLandscape ? 18 : 16;
  const rateFontSize = isStory ? 42 : isLandscape ? 28 : 24;
  const labelFontSize = isStory ? 22 : isLandscape ? 16 : 14;
  const sourceFontSize = isStory ? 18 : 13;
  const footerFontSize = isStory ? 22 : 14;
  const padding = isStory ? 48 : 32;
  const rowGap = isStory ? 36 : 20;

  const selectedPairsArr = Array.from(selectedPairs);
  const today = format(new Date(), "MMMM d, yyyy");

  return (
    <div
      ref={templateRef}
      style={{
        position: "absolute",
        left: "-9999px",
        top: "-9999px",
        width: dims.width,
        height: dims.height,
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
        fontFamily: "system-ui, -apple-system, sans-serif",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: `${padding}px ${padding}px ${padding * 0.75}px`,
        }}
      >
        {logoDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoDataUrl} alt="Fin" style={{ height: logoHeight, width: "auto" }} />
        ) : (
          <div style={{ height: logoHeight, width: logoHeight * 2, background: "transparent" }} />
        )}
        <span style={{ color: "#94a3b8", fontSize: dateFontSize, fontWeight: 400 }}>
          {today}
        </span>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "rgba(255,255,255,0.1)", marginInline: padding }} />

      {/* Rate rows */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: rowGap,
          padding: `${padding}px ${padding}px`,
        }}
      >
        {selectedPairsArr.map((pair) => {
          const meta = PAIR_LABELS[pair];
          const rateData = rates.find((r) => r.pair === RATE_PAIR_MAP[pair]);
          const rateValue = rateData ? `Bs. ${rateData.value.toFixed(2)}` : "—";
          const trend = rateData?.trend ?? "flat";
          const change = rateData?.change ?? "0.00%";
          const trendColor = trend === "up" ? "#22c55e" : trend === "down" ? "#ef4444" : "#94a3b8";
          const trendArrow = trend === "up" ? "▲" : trend === "down" ? "▼" : "—";

          return (
            <div
              key={pair}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              {/* Left: pair name + source */}
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span
                  style={{
                    color: meta.color,
                    fontSize: labelFontSize,
                    fontWeight: 700,
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                  }}
                >
                  {meta.name}
                </span>
                <span style={{ color: "#64748b", fontSize: sourceFontSize }}>
                  {meta.source}
                </span>
              </div>

              {/* Right: rate value + trend badge */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                <span style={{ color: "#f8fafc", fontSize: rateFontSize, fontWeight: 700 }}>
                  {rateValue}
                </span>
                <span
                  style={{
                    color: trendColor,
                    fontSize: sourceFontSize,
                    fontWeight: 600,
                    background: `${trendColor}18`,
                    padding: "2px 8px",
                    borderRadius: 999,
                  }}
                >
                  {trendArrow} {change}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "rgba(255,255,255,0.1)", marginInline: padding }} />

      {/* Footer */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: `${padding * 0.75}px ${padding}px ${padding}px`,
        }}
      >
        <span style={{ color: "#f8fafc", fontSize: footerFontSize, fontWeight: 600 }}>
          fin.app
        </span>
        <span style={{ color: "#64748b", fontSize: footerFontSize }}>
          {tagline}
        </span>
      </div>
    </div>
  );
}
