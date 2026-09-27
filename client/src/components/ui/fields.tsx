import { cn } from "@/lib/cn";
import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

type FieldProps = {
  label: string;
  error?: string;
  hint?: string;
  id?: string;
  className?: string;
};

export function TextField({
  label,
  error,
  hint,
  className,
  id,
  ...rest
}: FieldProps & InputHTMLAttributes<HTMLInputElement>) {
  const inputId = id || rest.name;
  return (
    <label className={cn("block space-y-1.5", className)}>
      <span className="text-sm font-semibold text-espresso">{label}</span>
      <input
        id={inputId}
        className={cn(
          "w-full rounded-2xl border border-espresso/15 bg-surface px-4 py-3 text-espresso placeholder:text-muted",
          "min-h-touch focus:border-espresso/40 focus:outline-none focus:ring-2 focus:ring-espresso/20",
          error && "border-red-500"
        )}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : undefined}
        {...rest}
      />
      {hint && !error && (
        <span className="text-xs text-muted">{hint}</span>
      )}
      {error && (
        <span id={`${inputId}-error`} className="text-xs text-red-600" role="alert">
          {error}
        </span>
      )}
    </label>
  );
}

export function TextAreaField({
  label,
  error,
  hint,
  className,
  id,
  ...rest
}: FieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const inputId = id || rest.name;
  return (
    <label className={cn("block space-y-1.5", className)}>
      <span className="text-sm font-semibold text-espresso">{label}</span>
      <textarea
        id={inputId}
        className={cn(
          "w-full rounded-2xl border border-espresso/15 bg-cream px-4 py-3 text-espresso placeholder:text-muted",
          "min-h-[100px] focus:border-espresso/40 focus:outline-none focus:ring-2 focus:ring-espresso/20",
          error && "border-red-500"
        )}
        aria-invalid={!!error}
        {...rest}
      />
      {hint && !error && (
        <span className="text-xs text-muted">{hint}</span>
      )}
      {error && (
        <span className="text-xs text-red-600" role="alert">
          {error}
        </span>
      )}
    </label>
  );
}

export function SelectField({
  label,
  error,
  hint,
  className,
  id,
  children,
  ...rest
}: FieldProps &
  React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }) {
  const inputId = id || rest.name;
  return (
    <label className={cn("block space-y-1.5", className)}>
      <span className="text-sm font-semibold text-espresso">{label}</span>
      <select
        id={inputId}
        className={cn(
          "w-full appearance-none rounded-2xl border border-espresso/15 bg-surface px-4 py-3 text-espresso",
          "min-h-touch focus:border-espresso/40 focus:outline-none focus:ring-2 focus:ring-espresso/20",
          error && "border-red-500"
        )}
        aria-invalid={!!error}
        {...rest}
      >
        {children}
      </select>
      {hint && !error && (
        <span className="text-xs text-muted">{hint}</span>
      )}
      {error && (
        <span className="text-xs text-red-600" role="alert">
          {error}
        </span>
      )}
    </label>
  );
}
