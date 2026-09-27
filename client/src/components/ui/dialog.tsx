"use client";

import {
  useEffect,
  useId,
  useRef,
  type ReactNode,
  type MouseEvent,
  type KeyboardEvent,
} from "react";
import { cn } from "@/lib/cn";

type DialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** bottom sheet on mobile, centered modal on md+ */
  variant?: "sheet" | "modal" | "auto";
  className?: string;
  labelledBy?: string;
  /** hide title visually but keep for a11y */
  titleSrOnly?: boolean;
};

export function Dialog({
  open,
  onClose,
  title,
  children,
  variant = "auto",
  className,
  labelledBy,
  titleSrOnly,
}: DialogProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    previousFocus.current = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const focusable = panel?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    focusable?.[0]?.focus();

    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panel) return;
      const nodes = panel.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      previousFocus.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  const sheetClass =
    variant === "modal"
      ? "items-center justify-center p-4"
      : variant === "sheet"
        ? "items-end justify-center sm:items-center sm:p-4"
        : "items-end justify-center md:items-center md:p-4";

  const panelMotion =
    variant === "modal"
      ? "animate-scale-in rounded-card max-h-[90vh]"
      : variant === "sheet"
        ? "animate-sheet-in rounded-t-[2rem] sm:animate-scale-in sm:rounded-card max-h-[92vh]"
        : "animate-sheet-in rounded-t-[2rem] md:animate-scale-in md:rounded-card max-h-[92vh]";

  const onBackdrop = (e: MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const onBackdropKey = (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") onClose();
  };

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex bg-espresso/40 backdrop-blur-[2px]",
        sheetClass
      )}
      role="presentation"
      onMouseDown={onBackdrop}
      onKeyDown={onBackdropKey}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy || titleId}
        className={cn(
          "relative flex w-full max-w-lg flex-col overflow-hidden bg-cream shadow-sheet",
          panelMotion,
          className
        )}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2
          id={titleId}
          className={cn(
            "px-5 pt-5 text-xl text-espresso",
            titleSrOnly && "sr-only"
          )}
        >
          {title}
        </h2>
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
