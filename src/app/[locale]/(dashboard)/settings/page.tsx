import { SettingsForm } from "@/components/settings/settings-form";
import { SettingsTitle } from "@/components/settings/settings-title";
import { requireUser } from "@/lib/auth/server";

export default async function SettingsPage() {
  const user = await requireUser();

  return (
    <div className="space-y-6">
      <SettingsTitle />

      <SettingsForm user={user} />
    </div>
  );
}
