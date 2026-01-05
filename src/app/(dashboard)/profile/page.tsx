import { ProfileForm } from "@/components/profile/profile-form";
import { requireUser } from "@/lib/auth/server";

export default async function ProfilePage() {
  const user = await requireUser();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">
          Manage your account information.
        </p>
      </div>

      <ProfileForm user={user} />
    </div>
  );
}
