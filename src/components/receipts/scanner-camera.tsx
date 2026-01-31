import { Camera } from "lucide-react";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

export const ScannerCamera = ({
  onCapture,
  onCancel,
}: {
  onCapture: (file: File) => void;
  onCancel: () => void;
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const t = useTranslations("ReceiptReviewForm");

  // Cleanup function to stop all tracks
  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    const startWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        toast.error(`Could not access camera: ${err}`);
        onCancel();
      }
    };

    startWebcam();

    // Cleanup on unmount
    return () => {
      stopStream();
    };
  }, [onCancel]);

  const capture = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0);

    // Stop stream immediately after capturing
    stopStream();

    canvas.toBlob(
      (blob) => {
        if (blob) {
          onCapture(
            new File([blob], `capture-${Date.now()}.jpg`, {
              type: "image/jpeg",
            }),
          );
        }
      },
      "image/jpeg",
      0.9,
    );
  };

  const handleCancel = () => {
    stopStream();
    onCancel();
  };

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <div className="relative w-full max-w-sm overflow-hidden rounded-lg border bg-black">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="h-64 w-full object-cover"
        />
      </div>
      <p className="text-center text-xs text-muted-foreground">
        {t("positionReceipt")}
      </p>
      <div className="flex w-full gap-2">
        <Button variant="outline" className="flex-1" onClick={handleCancel}>
          {t("cancel")}
        </Button>
        <Button className="flex-1" onClick={capture}>
          <Camera className="mr-2 h-4 w-4" />
          {t("capture")}
        </Button>
      </div>
    </div>
  );
};
