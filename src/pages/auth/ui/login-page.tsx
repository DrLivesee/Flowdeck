import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { supabase } from "@/shared/api";
import { Button } from "@/shared/ui";

import { getAuthErrorMessage } from "../model/auth-errors";
import { AuthFormField } from "./auth-form-field";
import { AuthShell } from "./auth-shell";

export function LoginPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    setIsSubmitting(false);

    if (authError) {
      setError(getAuthErrorMessage(authError) ?? t("auth.errors.default"));
    }
  }

  return (
    <AuthShell title={t("auth.login.title")} description={t("auth.login.description")}>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <AuthFormField
          id="login-email"
          label={t("auth.fields.email")}
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.currentTarget.value)}
        />
        <AuthFormField
          id="login-password"
          label={t("auth.fields.password")}
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.currentTarget.value)}
        />
        {error && <p className="rounded-2xl border border-rose-300/20 bg-rose-300/10 p-3 text-sm text-rose-100">{error}</p>}
        <Button className="w-full" type="submit" disabled={isSubmitting}>
          {isSubmitting ? t("auth.login.submitting") : t("auth.login.submit")}
        </Button>
      </form>
      <p className="mt-5 text-center text-sm text-slate-400">
        {t("auth.login.noAccount")} {" "}
        <Link className="font-semibold text-cyan-200 hover:text-cyan-100" to="/auth/register">
          {t("auth.login.registerLink")}
        </Link>
      </p>
    </AuthShell>
  );
}
