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
// import { updateProfile } from "@/actions/profile"; // We might need this if we want real functionality

interface ProfileFormProps {
  user: User;
}

export function ProfileForm({ user }: ProfileFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate update
    await new Promise((resolve) => setTimeout(resolve, 1000));
    toast.success("Profile updated");
    setIsLoading(false);
  };

  const initials = user.email ? user.email.slice(0, 2).toUpperCase() : "U";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Update your personal details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-lg bg-primary text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <Button variant="outline" size="sm" type="button">
              Change Avatar
            </Button>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={user.email || ""} disabled />
            <p className="text-xs text-muted-foreground">
              Email cannot be changed directly.
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="name">Display Name</Label>
            <Input id="name" placeholder="Your name" />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
