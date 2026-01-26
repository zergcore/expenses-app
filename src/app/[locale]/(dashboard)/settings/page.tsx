import { SettingsForm } from "@/components/settings/settings-form";
import { SettingsTitle } from "@/components/settings/settings-title";
import { requireUser } from "@/lib/auth/server";

export default async function SettingsPage() {
  await requireUser();

  return (
    <div className="space-y-6">
      <SettingsTitle />

      <SettingsForm />
    </div>
  );
}
