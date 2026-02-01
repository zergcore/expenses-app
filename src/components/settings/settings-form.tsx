"use client";

import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PasswordUpdateForm } from "./password-update-form";
import { Skeleton } from "../ui/skeleton";
import { useSyncExternalStore } from "react";
import { ThemeOption } from "./theme-option";
import { User } from "@supabase/supabase-js";
import { updateCurrencyPreference } from "@/actions/settings";
import { useState } from "react";

const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;
function useMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    getClientSnapshot,
    getServerSnapshot,
  );
}

interface SettingsFormProps {
  user: User;
}

export function SettingsForm({ user }: SettingsFormProps) {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();
  const t = useTranslations();

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Get the selected currency from the Select component (via accessible DOM or controlled state)
      // Since Shadcn Select doesn't expose a simple ref value, it's better to control it with state.
      // But refactoring to controlled state is safer.
      const formData = new FormData();
      formData.append("currency", currency);

      const result = await updateCurrencyPreference(formData);
      if (result.success) {
        toast.success(t("Settings.changesSaved"));
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("An error occurred");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const [currency, setCurrency] = useState(
    user.user_metadata?.currency || "USD",
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("Settings.title")}</CardTitle>
          <CardDescription>{t("Settings.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="currency">{t("Settings.defaultCurrency")}</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger id="currency">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD ($)</SelectItem>
                <SelectItem value="USDT">USDT (₮)</SelectItem>
                <SelectItem value="VED">VED (Bs.)</SelectItem>
                <SelectItem value="EUR">EUR (€)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {t("Settings.defaultCurrencyDescription")}
            </p>
          </div>

          <div className="space-y-2">
            <Label>{t("Settings.theme")}</Label>
            {mounted ? (
              <RadioGroup
                value={theme}
                onValueChange={setTheme}
                className="flex gap-4"
              >
                <ThemeOption id="light" label={t("Settings.light")} />
                <ThemeOption id="dark" label={t("Settings.dark")} />
                <ThemeOption id="system" label={t("Settings.system")} />
              </RadioGroup>
            ) : (
              <div className="flex gap-4">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-20" />
              </div>
            )}
          </div>

          <PasswordUpdateForm />
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Saving..." : t("Settings.savePreferenceChanges")}
        </Button>
      </div>
    </div>
  );
}
