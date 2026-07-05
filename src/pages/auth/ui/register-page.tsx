import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import type { AppRole } from "@/entities/profile";
import { supabase } from "@/shared/api";
import { Button, Select } from "@/shared/ui";

import { getAuthErrorMessage } from "../model/auth-errors";
import { AuthFormField } from "./auth-form-field";
import { AuthShell } from "./auth-shell";

type RegistrationRole = Exclude<AppRole, "admin">;

const registrationRoles = ["manager", "worker", "guest"] as const satisfies readonly RegistrationRole[];

export function RegisterPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<RegistrationRole>("worker");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const roleOptions = registrationRoles.map((value) => ({
    value,
    label: t(`auth.roles.${value}`),
  }));

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setStatus(null);
    setIsSubmitting(true);

    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName.trim(), role } },
    });
    setIsSubmitting(false);

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
      <form className="space-y-4" onSubmit={handleSubmit}>
        <AuthFormField id="register-name" label={t("auth.fields.fullName")} required value={fullName} onChange={(event) => setFullName(event.currentTarget.value)} />
        <AuthFormField id="register-email" label={t("auth.fields.email")} type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.currentTarget.value)} />
        <AuthFormField id="register-password" label={t("auth.fields.password")} type="password" autoComplete="new-password" required minLength={6} value={password} onChange={(event) => setPassword(event.currentTarget.value)} />
        <label className="block" htmlFor="register-role">
          <span className="text-sm font-semibold text-slate-300">{t("auth.fields.role")}</span>
          <div className="mt-2">
            <Select
              ariaLabel={t("auth.fields.role")}
              options={roleOptions}
              value={role}
              onValueChange={(value) => {
                if (isRegistrationRole(value)) {
                  setRole(value);
                }
              }}
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

function isRegistrationRole(value: string): value is RegistrationRole {
  return registrationRoles.some((role) => role === value);
}
