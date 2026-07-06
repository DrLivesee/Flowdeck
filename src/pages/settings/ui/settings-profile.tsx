import { zodResolver } from "@hookform/resolvers/zod";
import { ShieldCheck, UserRound } from "lucide-react";
import { useEffect, useId, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { useProfileQuery, useUpdateOwnProfileMutation, type AppRole } from "@/entities/profile";
import { useAuth } from "@/entities/session";
import { getTodayISODate } from "@/shared/lib";
import { Badge, Button, InlineAlert, Input } from "@/shared/ui";

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
  const updateProfile = useUpdateOwnProfileMutation();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const firstNameId = useId();
  const lastNameId = useId();
  const middleNameId = useId();
  const birthDateId = useId();
  const today = getTodayISODate();
  const schema = useMemo(
    () =>
      z.object({
        firstName: z.string().trim().min(1, t("settings.profile.validation.firstNameRequired")),
        lastName: z.string().trim().min(1, t("settings.profile.validation.lastNameRequired")),
        middleName: z.string().trim(),
        birthDate: z
          .string()
          .refine((value) => !value || value <= today, t("settings.profile.validation.birthDateFuture")),
      }),
    [t, today],
  );
  type ProfileFormValues = z.infer<typeof schema>;
  const {
    formState: { errors, isDirty, isSubmitting },
    handleSubmit,
    register,
    reset,
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: "",
      lastName: "",
      middleName: "",
      birthDate: "",
    },
  });

  useEffect(() => {
    if (!profile) {
      return;
    }

    reset({
      firstName: profile.firstName,
      lastName: profile.lastName,
      middleName: profile.middleName ?? "",
      birthDate: profile.birthDate ?? "",
    });
  }, [profile, reset]);

  async function onSubmit(values: ProfileFormValues) {
    setSuccessMessage(null);

    try {
      await updateProfile.mutateAsync({
        firstName: values.firstName,
        lastName: values.lastName,
        middleName: values.middleName || undefined,
        birthDate: values.birthDate || undefined,
      });
    } catch {
      return;
    }

    reset(values);
    setSuccessMessage(t("settings.profile.saved"));
  }

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
            <ProfileItem label={t("settings.profile.fields.email")} value={profile.email} />
            <ProfileItem label={t("settings.profile.fields.role")} value={t(`settings.profile.roles.${profile.role}`)} />
          </dl>

          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            {updateProfile.isError && <InlineAlert>{t("settings.profile.saveError")}</InlineAlert>}
            {successMessage && <InlineAlert className="border-cyan-300/20 bg-cyan-300/10 text-cyan-50">{successMessage}</InlineAlert>}

            <div className="grid gap-4 sm:grid-cols-2">
              <ProfileFormField error={errors.firstName?.message} htmlFor={firstNameId} label={t("settings.profile.fields.firstName")}>
                <Input id={firstNameId} autoComplete="given-name" {...register("firstName")} />
              </ProfileFormField>
              <ProfileFormField error={errors.lastName?.message} htmlFor={lastNameId} label={t("settings.profile.fields.lastName")}>
                <Input id={lastNameId} autoComplete="family-name" {...register("lastName")} />
              </ProfileFormField>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <ProfileFormField error={errors.middleName?.message} htmlFor={middleNameId} label={t("settings.profile.fields.middleName")}>
                <Input id={middleNameId} autoComplete="additional-name" {...register("middleName")} />
              </ProfileFormField>
              <ProfileFormField error={errors.birthDate?.message} htmlFor={birthDateId} label={t("settings.profile.fields.birthDate")}>
                <Input id={birthDateId} type="date" max={today} {...register("birthDate")} />
              </ProfileFormField>
            </div>

            <Button type="submit" disabled={!isDirty} isLoading={isSubmitting || updateProfile.isPending} loadingLabel={t("settings.profile.saving")}>
              {t("settings.profile.save")}
            </Button>
          </form>
        </div>
      )}
    </PreferenceCard>
  );
}

function ProfileFormField({
  children,
  error,
  htmlFor,
  label,
}: {
  children: React.ReactNode;
  error?: string;
  htmlFor: string;
  label: string;
}) {
  return (
    <label className="block" htmlFor={htmlFor}>
      <span className="text-sm font-semibold text-slate-300">{label}</span>
      <div className="mt-2">{children}</div>
      {error && <span className="mt-2 block text-xs leading-5 text-rose-200">{error}</span>}
    </label>
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
