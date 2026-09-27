"use client";

import { cn } from "@/lib/utils";
import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes } from "react";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "flex h-10 w-full rounded-md border border-espresso/15 bg-cream-soft px-3 text-sm text-espresso placeholder:text-espresso/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-espresso/30 disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "flex min-h-[88px] w-full rounded-md border border-espresso/15 bg-cream-soft px-3 py-2 text-sm text-espresso placeholder:text-espresso/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-espresso/30 disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        "flex h-10 w-full rounded-md border border-espresso/15 bg-cream-soft px-3 text-sm text-espresso focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-espresso/30 disabled:opacity-50",
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
);
Select.displayName = "Select";

export function Label({
  className,
  children,
  htmlFor,
}: {
  className?: string;
  children: React.ReactNode;
  htmlFor?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn("mb-1.5 block text-xs font-medium uppercase tracking-wide text-espresso/70", className)}
    >
      {children}
    </label>
  );
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-rose-700">{message}</p>;
}
