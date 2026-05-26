"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { format } from "date-fns";
import { Share2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  ShareRatesImageTemplate,
  PLATFORM_DIMENSIONS,
  type SharePair,
  type SharePlatform,
} from "./share-rates-image-template";
import type { RateData } from "@/actions/rates";

const ALL_PAIRS: SharePair[] = ["USDT_VES", "USD_VES", "EUR_VES"];

interface ShareRatesButtonProps {
  rates: RateData[];
}

export function ShareRatesButton({ rates }: ShareRatesButtonProps) {
  const t = useTranslations("Rates");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPairs, setSelectedPairs] = useState<Set<SharePair>>(
    new Set(ALL_PAIRS),
  );
  const [platform, setPlatform] = useState<SharePlatform>("general");
  const [isGenerating, setIsGenerating] = useState(false);
  const templateRef = useRef<HTMLDivElement>(null);

  const togglePair = (pair: SharePair) => {
    setSelectedPairs((prev) => {
      const next = new Set(prev);
      if (next.has(pair)) next.delete(pair);
      else next.add(pair);
      return next;
    });
  };

  const handleGenerate = async () => {
    if (selectedPairs.size === 0 || !templateRef.current) return;
    setIsGenerating(true);

    try {
      const dims = PLATFORM_DIMENSIONS[platform];
      // Allow DOM to settle after dimension change
      await new Promise((r) => setTimeout(r, 80));

      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(templateRef.current, {
        width: dims.width,
        height: dims.height,
        pixelRatio: 2,
        cacheBust: true,
      });

      // Convert base64 data URL to blob directly (avoids CSP connect-src blocking data: URIs)
      const base64 = dataUrl.split(",")[1];
      const byteString = atob(base64);
      const arrayBuffer = new ArrayBuffer(byteString.length);
      const uint8Array = new Uint8Array(arrayBuffer);
      for (let i = 0; i < byteString.length; i++) {
        uint8Array[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([uint8Array], { type: "image/png" });
      const fileName = `rates-${format(new Date(), "yyyy-MM-dd")}.png`;
      const file = new File([blob], fileName, { type: "image/png" });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "Fin Rates" });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch {
      toast.error(t("share_error"));
    } finally {
      setIsGenerating(false);
    }
  };

  const platforms: { key: SharePlatform; label: string; hint: string }[] = [
    { key: "general", label: t("share_platform_general"), hint: t("share_platform_general_hint") },
    { key: "twitter", label: t("share_platform_twitter"), hint: t("share_platform_twitter_hint") },
    { key: "story", label: t("share_platform_story"), hint: t("share_platform_story_hint") },
  ];

  const pairLabels: Record<SharePair, string> = {
    USDT_VES: "USDT / VES",
    USD_VES: "USD / VES",
    EUR_VES: "EUR / VES",
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setIsOpen(true)}>
        <Share2 className="h-4 w-4 mr-2" />
        {t("share_rates")}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("share_dialog_title")}</DialogTitle>
            <DialogDescription className="sr-only">
              {t("share_dialog_title")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Step 1 — Select rates */}
            <div className="space-y-2">
              <p className="text-sm font-medium">{t("share_step_rates")}</p>
              <div className="space-y-2">
                {ALL_PAIRS.map((pair) => (
                  <label
                    key={pair}
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedPairs.has(pair)}
                      onCheckedChange={() => togglePair(pair)}
                    />
                    <span className="text-sm">{pairLabels[pair]}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Step 2 — Select platform */}
            <div className="space-y-2">
              <p className="text-sm font-medium">{t("share_step_platform")}</p>
              <div className="grid grid-cols-3 gap-2">
                {platforms.map((p) => (
                  <button
                    key={p.key}
                    onClick={() => setPlatform(p.key)}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-lg border p-3 text-center transition-colors hover:bg-muted",
                      platform === p.key && "ring-2 ring-primary border-primary",
                    )}
                  >
                    <span className="text-xs font-medium leading-tight">
                      {p.label}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {p.hint}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Generate button */}
            <Button
              className="w-full"
              disabled={selectedPairs.size === 0 || isGenerating}
              onClick={handleGenerate}
              title={selectedPairs.size === 0 ? t("share_select_at_least_one") : undefined}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t("share_generating")}
                </>
              ) : (
                t("share_generate")
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Hidden image template — must always be in DOM for ref capture */}
      <ShareRatesImageTemplate
        rates={rates}
        selectedPairs={selectedPairs}
        platform={platform}
        templateRef={templateRef}
        tagline={t("share_image_tagline")}
      />
    </>
  );
}
