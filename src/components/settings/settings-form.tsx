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

export function SettingsForm() {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();
  const t = useTranslations();

  const handleSave = () => {
    // todo: In a real app, this should likely trigger a Server Action or API call
    toast.success("Settings saved successfully");
  };

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
            <Select defaultValue="USD">
              <SelectTrigger id="currency">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD ($)</SelectItem>
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
        <Button onClick={handleSave}>
          {t("Settings.savePreferenceChanges")}
        </Button>
      </div>
    </div>
  );
}
