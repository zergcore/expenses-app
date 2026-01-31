"use client";

import { useState, useRef, useTransition, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { scanReceipt, createExpenseFromReceipt } from "@/actions/scan-receipt";
import type { ReceiptExtraction } from "@/lib/schemas/receipt";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Camera, Loader2, Receipt, Upload } from "lucide-react";
import type { Category } from "@/lib/categories";
import { ReceiptReviewForm, type ReceiptFormData } from "./receipt-review-form";
import { ScannerCamera } from "./scanner-camera";
import { useTranslations } from "next-intl";

type ScanState =
  | "idle"
  | "webcam"
  | "compressing"
  | "uploading"
  | "scanning"
  | "review"
  | "saving";

interface ReceiptScannerProps {
  categories: Category[];
  onSuccess?: () => void;
  triggerButton?: React.ReactNode;
}

export function ReceiptScanner({
  categories,
  onSuccess,
  triggerButton,
}: ReceiptScannerProps) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<ScanState>("idle");
  const [extractedData, setExtractedData] = useState<ReceiptExtraction | null>(
    null,
  );
  const [receiptId, setReceiptId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const t = useTranslations("ReceiptScanner");

  const resetState = useCallback(() => {
    setState("idle");
    setExtractedData(null);
    setReceiptId(null);
  }, []);

  const handleProcessImage = async (file: File) => {
    try {
      // 4. Optimization: Dynamic Import to reduce initial bundle size
      setState("compressing");
      const imageCompression = (await import("browser-image-compression"))
        .default;

      const compressedFile = await imageCompression(file, {
        maxSizeMB: 0.2,
        maxWidthOrHeight: 1024,
        useWebWorker: true,
        fileType: "image/webp",
      });

      setState("uploading");
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const filename = `${user.id}/${Date.now()}-${file.name.slice(0, 10)}.webp`;
      const { error: uploadError } = await supabase.storage
        .from("receipts")
        .upload(filename, compressedFile, { contentType: "image/webp" });

      if (uploadError) throw new Error(uploadError.message);

      setState("scanning");
      startTransition(async () => {
        const result = await scanReceipt(filename);
        if (!result.success || !result.extractedData) {
          throw new Error(result.error || "Scan failed");
        }
        setReceiptId(result.receiptId!);
        setExtractedData(result.extractedData);
        setState("review");
        toast.success("Receipt scanned!");
      });
    } catch (error) {
      console.error(error);
      toast.error("Failed to process receipt");
      resetState();
    }
  };

  const handleSave = (formData: ReceiptFormData) => {
    if (!receiptId) return;
    setState("saving");

    startTransition(async () => {
      const result = await createExpenseFromReceipt(receiptId, {
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        category_id:
          formData.categoryId === "none" ? undefined : formData.categoryId,
        description: formData.description,
        date: formData.date,
      });

      if (!result.success) {
        toast.error(result.error);
        setState("review");
        return;
      }
      toast.success("Expense created!");
      setOpen(false);
      resetState();
      onSuccess?.();
    });
  };

  // Helper for mobile detection
  const handleCameraClick = () => {
    const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
    if (isMobile) cameraInputRef.current?.click();
    else setState("webcam");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        setOpen(val);
        if (!val) resetState();
      }}
    >
      <DialogTrigger asChild>
        {triggerButton || (
          <Button variant="outline">
            <Receipt className="mr-2 h-4 w-4" /> Scan Receipt
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {state === "review" ? t("confirmExpense") : t("scanReceipt")}
          </DialogTitle>
          <DialogDescription>
            {state === "review"
              ? t("verifyExtractedDetails")
              : t("uploadReceipt")}
          </DialogDescription>
        </DialogHeader>

        {state === "idle" && (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="rounded-full bg-muted p-6">
              <Receipt className="h-12 w-12 text-muted-foreground" />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mr-2 h-4 w-4" /> {t("upload")}
              </Button>
              <Button onClick={handleCameraClick}>
                <Camera className="mr-2 h-4 w-4" /> {t("camera")}
              </Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) =>
                e.target.files?.[0] && handleProcessImage(e.target.files[0])
              }
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) =>
                e.target.files?.[0] && handleProcessImage(e.target.files[0])
              }
            />
          </div>
        )}

        {state === "webcam" && (
          <ScannerCamera onCapture={handleProcessImage} onCancel={resetState} />
        )}

        {(state === "compressing" ||
          state === "uploading" ||
          state === "scanning") && (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-sm text-muted-foreground capitalize">
              {t(state)}...
            </p>
          </div>
        )}

        {(state === "review" || state === "saving") && extractedData && (
          <ReceiptReviewForm
            data={extractedData}
            categories={categories}
            onSave={handleSave}
            onCancel={resetState}
            isPending={isPending || state === "saving"}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
