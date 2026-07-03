import type { ReactNode } from "react";

type FormFieldProps = {
  children: ReactNode;
  error?: string;
  htmlFor?: string;
  label: string;
};

export function FormField({ children, error, htmlFor, label }: FormFieldProps) {
  const labelElement = htmlFor ? (
    <label className="mb-2 block text-sm font-semibold text-slate-300" htmlFor={htmlFor}>{label}</label>
  ) : (
    <span className="mb-2 block text-sm font-semibold text-slate-300">{label}</span>
  );

  return (
    <div className="block">
      {labelElement}
      {children}
      {error && <span className="mt-2 block text-sm text-rose-300">{error}</span>}
    </div>
  );
}
