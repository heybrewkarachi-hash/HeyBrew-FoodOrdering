"use client";

import { cn } from "@/lib/utils";
import { forwardRef, type ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-espresso text-cream-soft hover:bg-espresso-soft shadow-sm disabled:opacity-50",
  secondary:
    "bg-caramel text-cream-soft hover:bg-caramel-soft hover:text-espresso disabled:opacity-50",
  ghost: "bg-transparent text-espresso hover:bg-cream-deep disabled:opacity-50",
  danger: "bg-rose-800 text-white hover:bg-rose-700 disabled:opacity-50",
  outline:
    "border border-espresso/20 bg-cream-soft text-espresso hover:bg-cream-deep disabled:opacity-50",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-5 text-sm",
};

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-espresso/40",
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-r-transparent" />
      ) : null}
      {children}
    </button>
  )
);
Button.displayName = "Button";
