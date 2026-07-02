import { AccountDangerZone } from "./account-danger-zone";
import { SettingsProfile } from "./settings-profile";
import { SettingsPreferences } from "./settings-preferences";
import { SettingsTags } from "./settings-tags";

export function SettingsPage() {
  return (
    <section className="space-y-6">
      <SettingsProfile />
      <div className="grid items-start gap-6 xl:grid-cols-2">
        <SettingsPreferences />
        <SettingsTags />
      </div>
      <AccountDangerZone />
    </section>
  );
}
