"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { User } from "@supabase/supabase-js";
import { useState } from "react";
import { useTranslations } from "next-intl";
// import { updateProfile } from "@/actions/profile";

interface ProfileFormProps {
  user: User;
}

export function ProfileForm({ user }: ProfileFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const t = useTranslations();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate update
    await new Promise((resolve) => setTimeout(resolve, 1000));
    toast.success(t("Profile.profile_updated"));
    setIsLoading(false);
  };

  const initials = user.email ? user.email.slice(0, 2).toUpperCase() : "U";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("Profile.profile_information")}</CardTitle>
          <CardDescription>{t("Profile.profile_description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-lg bg-primary text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <Button variant="outline" size="sm" type="button">
              {t("Profile.change_avatar")}
            </Button>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={user.email || ""} disabled />
            <p className="text-xs text-muted-foreground">
              {t("Profile.email_cannot_be_changed_directly")}
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="name">{t("Profile.display_name")}</Label>
            <Input
              id="name"
              defaultValue={user.email?.split("@")[0] || ""}
              placeholder="Your name"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? t("Profile.saving") : t("Profile.save_changes")}
        </Button>
      </div>
    </form>
  );
}
