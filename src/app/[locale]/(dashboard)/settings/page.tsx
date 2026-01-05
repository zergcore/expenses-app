import { SettingsForm } from "@/components/settings/settings-form";
import { requireUser } from "@/lib/auth/server";

export default async function SettingsPage() {
  await requireUser();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your application preferences.
        </p>
      </div>

      <SettingsForm />
    </div>
  );
}
