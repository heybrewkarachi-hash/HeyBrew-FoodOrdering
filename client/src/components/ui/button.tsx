import { cn } from "@/lib/cn";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "md" | "lg" | "icon";
  children: ReactNode;
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  type = "button",
  ...rest
}: Props) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-display font-bold transition disabled:cursor-not-allowed disabled:opacity-50",
        "touch-target rounded-pill",
        variant === "primary" &&
          "bg-espresso text-cream hover:bg-espresso/90 active:scale-[0.98]",
        variant === "secondary" &&
          "bg-surface text-espresso hover:bg-surface/80",
        variant === "ghost" && "bg-transparent text-espresso hover:bg-surface",
        variant === "danger" && "bg-red-700 text-white hover:bg-red-800",
        size === "md" && "px-5 py-2.5 text-sm",
        size === "lg" && "px-6 py-3.5 text-base",
        size === "icon" && "h-11 w-11 p-0",
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
