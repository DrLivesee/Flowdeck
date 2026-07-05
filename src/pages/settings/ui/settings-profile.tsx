import { ShieldCheck, UserRound } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useProfileQuery, type AppRole } from "@/entities/profile";
import { useAuth } from "@/entities/session";
import { Badge } from "@/shared/ui";

import { PreferenceCard } from "./preference-card";

const roleBadgeVariant: Record<AppRole, "amber" | "cyan" | "slate" | "violet"> = {
  admin: "violet",
  guest: "slate",
  manager: "cyan",
  worker: "amber",
};

export function SettingsProfile() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: profile, isError, isLoading } = useProfileQuery(user?.id);

  return (
    <PreferenceCard
      icon={<UserRound className="size-5" />}
      title={t("settings.profile.title")}
      description={t("settings.profile.description")}
    >
      {isLoading && <p className="text-sm text-slate-500">{t("settings.profile.loading")}</p>}
      {isError && <p className="text-sm text-rose-200">{t("settings.profile.error")}</p>}
      {profile && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-cyan-300/10 text-cyan-200">
              <ShieldCheck className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-bold text-white">{profile.fullName}</p>
              <p className="truncate text-sm text-slate-500">{profile.email}</p>
            </div>
            <Badge variant={roleBadgeVariant[profile.role]}>
              {t(`settings.profile.roles.${profile.role}`)}
            </Badge>
          </div>

          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <ProfileItem label={t("settings.profile.fields.fullName")} value={profile.fullName} />
            <ProfileItem label={t("settings.profile.fields.email")} value={profile.email} />
            <ProfileItem label={t("settings.profile.fields.role")} value={t(`settings.profile.roles.${profile.role}`)} />
          </dl>
        </div>
      )}
    </PreferenceCard>
  );
}

function ProfileItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
      <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</dt>
      <dd className="mt-1 truncate font-medium text-slate-200">{value}</dd>
    </div>
  );
}
