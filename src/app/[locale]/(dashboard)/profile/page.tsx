import { ProfileForm } from "@/components/profile/profile-form";
import { requireUser } from "@/lib/auth/server";
import { ProfileTitle } from "@/components/profile/profile-title";

export default async function ProfilePage() {
  const user = await requireUser();

  return (
    <div className="space-y-6">
      <ProfileTitle />

      <ProfileForm user={user} />
    </div>
  );
}
