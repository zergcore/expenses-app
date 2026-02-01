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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { User } from "@supabase/supabase-js";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { updateProfile } from "@/actions/profile";
import { createClient } from "@/lib/supabase/client";
import { Camera, Loader2 } from "lucide-react";
import { useRef } from "react";

interface ProfileFormProps {
  user: User;
}

export function ProfileForm({ user }: ProfileFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    user.user_metadata?.avatar_url || null,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = useTranslations();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const name = (document.getElementById("name") as HTMLInputElement).value;
    formData.append("fullName", name);

    const result = await updateProfile(formData);

    if (result.success) {
      toast.success(t("Profile.profile_updated"));
    } else {
      toast.error(result.error);
    }

    setIsLoading(false);
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    setIsUploading(true);
    try {
      const supabase = createClient();
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath);

      setAvatarUrl(publicUrl);

      const formData = new FormData();
      formData.append("avatarUrl", publicUrl);

      const result = await updateProfile(formData);

      if (result.success) {
        toast.success(t("Profile.profile_updated"));
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast.error("Error updating avatar");
      console.error(error);
    } finally {
      setIsUploading(false);
    }
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
            <div className="relative group">
              <Avatar
                className="h-16 w-16 cursor-pointer"
                onClick={handleAvatarClick}
              >
                <AvatarImage
                  src={avatarUrl || ""}
                  alt="Avatar"
                  className="object-cover"
                />
                <AvatarFallback className="text-lg bg-primary text-primary-foreground">
                  {initials}
                </AvatarFallback>
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full pointer-events-none">
                  <Camera className="h-6 w-6 text-white" />
                </div>
              </Avatar>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={handleAvatarClick}
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                t("Profile.change_avatar")
              )}
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
              defaultValue={
                user.user_metadata?.full_name || user.email?.split("@")[0] || ""
              }
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
