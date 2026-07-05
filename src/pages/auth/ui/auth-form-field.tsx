import type { ComponentPropsWithoutRef } from "react";

import { Input } from "@/shared/ui";

type AuthFormFieldProps = ComponentPropsWithoutRef<"input"> & {
  label: string;
};

export function AuthFormField({ id, label, ...props }: AuthFormFieldProps) {
  return (
    <label className="block" htmlFor={id}>
      <span className="text-sm font-semibold text-slate-300">{label}</span>
      <Input id={id} className="mt-2" {...props} />
    </label>
  );
}
