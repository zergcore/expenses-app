// components/settings/PasswordUpdateForm.tsx
"use client";

import { useState } from "react";
import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { changePassword } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useEffect } from "react";

export function PasswordUpdateForm() {
  const t = useTranslations();
  const [isOpen, setIsOpen] = useState(false);

  const [state, action, isPending] = useActionState(changePassword, {});

  useEffect(() => {
    if (state?.success) {
      toast.success("Password updated successfully");

      const timer = setTimeout(() => {
        setIsOpen(false);
      }, 0);

      return () => clearTimeout(timer);
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <div className="border-t pt-4">
      <Button
        type="button"
        variant="outline"
        className="w-full justify-between"
        onClick={() => setIsOpen(!isOpen)}
      >
        {t("Settings.change_password_toggle")}
        {isOpen ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </Button>

      {isOpen && (
        <form
          action={action}
          className="space-y-4 mt-4 animate-in fade-in slide-in-from-top-2"
        >
          <div className="space-y-2">
            <Label htmlFor="password">{t("Settings.newPassword")}</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              placeholder="••••••••"
            />
          </div>
          <Button type="submit" disabled={isPending}>
            {isPending ? t("Settings.updating") : t("Settings.updatePassword")}
          </Button>
        </form>
      )}
    </div>
  );
}
