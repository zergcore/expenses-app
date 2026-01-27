"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { Input } from "@/components/ui/input";
import { changePassword } from "@/actions/auth";
import { useActionState } from "react";
import { useTranslations } from "next-intl";

export function SettingsForm() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const t = useTranslations();
  const [passwordState, passwordAction, isPasswordPending] = useActionState(
    changePassword,
    {},
  );

  useEffect(() => {
    // Use setTimeout to avoid synchronous state update warning during effect
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (passwordState?.success) {
      toast.success("Password updated successfully");
    } else if (passwordState?.error) {
      toast.error(passwordState.error);
    }
  }, [passwordState]);

  const handleSave = () => {
    toast.success("Settings saved successfully");
  };

  if (!mounted) return null; // Avoid hydration mismatch on initial load

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
            <RadioGroup
              defaultValue={theme}
              onValueChange={(value) => setTheme(value)}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="light" id="light" />
                <Label htmlFor="light">{t("Settings.light")}</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="dark" id="dark" />
                <Label htmlFor="dark">{t("Settings.dark")}</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="system" id="system" />
                <Label htmlFor="system">{t("Settings.system")}</Label>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("Settings.security")}</CardTitle>
          <CardDescription>{t("Settings.securityDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={passwordAction} className="space-y-4">
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
            <Button type="submit" disabled={isPasswordPending}>
              {isPasswordPending
                ? t("Settings.updating")
                : t("Settings.updatePassword")}
            </Button>
          </form>
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
