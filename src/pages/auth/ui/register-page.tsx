import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { supabase } from "@/shared/api";
import { getTodayISODate } from "@/shared/lib";
import { Button, Select } from "@/shared/ui";

import { getAuthErrorMessage } from "../model/auth-errors";
import { createRegisterSchema, registrationRoles, type RegisterFormValues } from "../model/register-form";
import { AuthFormField } from "./auth-form-field";
import { AuthShell } from "./auth-shell";

export function RegisterPage() {
  const { t } = useTranslation();
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const schema = useMemo(() => createRegisterSchema(t), [t]);
  const today = getTodayISODate();
  const roleOptions = useMemo(
    () => registrationRoles.map((value) => ({ value, label: t(`auth.roles.${value}`) })),
    [t],
  );
  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: "",
      lastName: "",
      middleName: "",
      birthDate: "",
      email: "",
      password: "",
      role: "worker",
    },
  });
  const role = useWatch({ control, name: "role" });

  async function onSubmit(values: RegisterFormValues) {
    setError(null);
    setStatus(null);

    const { data, error: authError } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: {
          first_name: values.firstName,
          last_name: values.lastName,
          middle_name: values.middleName || null,
          birth_date: values.birthDate || null,
          role: values.role,
        },
      },
    });

    if (authError) {
      setError(getAuthErrorMessage(authError) ?? t("auth.errors.default"));
      return;
    }

    if (!data.session) {
      setStatus(t("auth.register.confirmEmail"));
    }
  }

  return (
    <AuthShell title={t("auth.register.title")} description={t("auth.register.description")}>
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-4 sm:grid-cols-2">
          <AuthFormField id="register-first-name" label={t("auth.fields.firstName")} error={errors.firstName?.message} autoComplete="given-name" required {...register("firstName")} />
          <AuthFormField id="register-last-name" label={t("auth.fields.lastName")} error={errors.lastName?.message} autoComplete="family-name" required {...register("lastName")} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <AuthFormField id="register-middle-name" label={t("auth.fields.middleName")} error={errors.middleName?.message} autoComplete="additional-name" {...register("middleName")} />
          <AuthFormField id="register-birth-date" label={t("auth.fields.birthDate")} error={errors.birthDate?.message} type="date" max={today} {...register("birthDate")} />
        </div>
        <AuthFormField id="register-email" label={t("auth.fields.email")} error={errors.email?.message} type="email" autoComplete="email" required {...register("email")} />
        <AuthFormField id="register-password" label={t("auth.fields.password")} error={errors.password?.message} type="password" autoComplete="new-password" required minLength={8} {...register("password")} />
        <p className="text-xs leading-5 text-slate-500">{t("auth.register.passwordHint")}</p>
        <label className="block" htmlFor="register-role">
          <span className="text-sm font-semibold text-slate-300">{t("auth.fields.role")}</span>
          <div className="mt-2">
            <Controller
              control={control}
              name="role"
              render={({ field }) => (
                <Select
                  ariaLabel={t("auth.fields.role")}
                  options={roleOptions}
                  value={field.value}
                  onValueChange={field.onChange}
                />
              )}
            />
          </div>
          <p className="mt-2 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-3 text-xs leading-5 text-cyan-50">
            {t(`auth.roleHints.${role}`)}
          </p>
          <p className="mt-2 text-xs leading-5 text-slate-500">{t("auth.register.accessNote")}</p>
        </label>
        {error && <p className="rounded-2xl border border-rose-300/20 bg-rose-300/10 p-3 text-sm text-rose-100">{error}</p>}
        {status && <p className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-3 text-sm text-cyan-50">{status}</p>}
        <Button className="w-full" type="submit" isLoading={isSubmitting} loadingLabel={t("auth.register.submitting")}>
          {t("auth.register.submit")}
        </Button>
      </form>
      <p className="mt-5 text-center text-sm text-slate-400">
        {t("auth.register.hasAccount")} {" "}
        <Link className="font-semibold text-cyan-200 hover:text-cyan-100" to="/auth/login">
          {t("auth.register.loginLink")}
        </Link>
      </p>
    </AuthShell>
  );
}
