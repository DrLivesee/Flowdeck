import type { ComponentPropsWithoutRef } from "react";

import { Input } from "@/shared/ui";

type AuthFormFieldProps = ComponentPropsWithoutRef<"input"> & {
  error?: string;
  label: string;
};

export function AuthFormField({ error, id, label, ...props }: AuthFormFieldProps) {
  const errorId = error && id ? `${id}-error` : undefined;

  return (
    <label className="block" htmlFor={id}>
      <span className="text-sm font-semibold text-slate-300">{label}</span>
      <Input id={id} className="mt-2" aria-describedby={errorId} aria-invalid={Boolean(error) || undefined} {...props} />
      {error && (
        <span id={errorId} className="mt-2 block text-xs leading-5 text-rose-200">
          {error}
        </span>
      )}
    </label>
  );
}
