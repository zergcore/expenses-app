import { Check, Loader2 } from "lucide-react";
import { DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Category } from "@/lib/categories";
import { ReceiptExtraction } from "@/lib/schemas/receipt";
import { useTranslations } from "next-intl";

// Exported type for shared use
export interface ReceiptFormData {
  amount: string;
  currency: string;
  categoryId: string;
  description: string;
  date: string;
}

export const ReceiptReviewForm = ({
  data,
  categories,
  onSave,
  onCancel,
  isPending,
}: {
  data: ReceiptExtraction;
  categories: Category[];
  onSave: (formData: ReceiptFormData) => void;
  onCancel: () => void;
  isPending: boolean;
}) => {
  // Local state for the form - isolated from the main scanner logic
  const [formState, setFormState] = useState({
    amount: data.totalAmount.toString(),
    currency: data.currency || "USD",
    categoryId: "none",
    description: data.merchantName || "",
    date: data.transactionDate || "",
  });
  const t = useTranslations("ReceiptReviewForm");

  const handleChange = (field: string, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <>
      <div className="space-y-4">
        {/* Simplified Preview Header */}
        <div className="rounded-lg bg-muted/50 p-3">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-medium text-sm">{data.merchantName}</p>
              <p className="text-xs text-muted-foreground">
                {data.transactionDate}
              </p>
            </div>
            {data.confidence && (
              <span
                className={cn(
                  "text-xs px-2 py-0.5 rounded-full",
                  data.confidence > 0.8
                    ? "bg-green-100 text-green-700"
                    : "bg-yellow-100 text-yellow-700",
                )}
              >
                {Math.round(data.confidence * 100)}% Match
              </span>
            )}
          </div>
        </div>

        {/* Form Fields */}
        <div className="grid gap-3">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Amount</Label>
            <Input
              type="number"
              value={formState.amount}
              onChange={(e) => handleChange("amount", e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Currency</Label>
            <Select
              value={formState.currency}
              onValueChange={(v) => handleChange("currency", v)}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD ($)</SelectItem>
                <SelectItem value="VES">VES (Bs.)</SelectItem>
                <SelectItem value="EUR">EUR (€)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Category</Label>
            <Select
              value={formState.categoryId}
              onValueChange={(v) => handleChange("categoryId", v)}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Uncategorized</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.icon} {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Note</Label>
            <Input
              value={formState.description}
              onChange={(e) => handleChange("description", e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Date</Label>
            <Input
              type="date"
              value={formState.date}
              onChange={(e) => handleChange("date", e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>
      </div>

      <DialogFooter className="mt-4">
        <Button variant="outline" onClick={onCancel} disabled={isPending}>
          {t("cancel")}
        </Button>
        <Button onClick={() => onSave(formState)} disabled={isPending}>
          {isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Check className="mr-2 h-4 w-4" />
          )}
          {t("createExpense")}
        </Button>
      </DialogFooter>
    </>
  );
};
