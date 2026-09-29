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
  /** Compact modal: no inner scroll — content must fit one viewport */
  fitViewport?: boolean;
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
  fitViewport = false,
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
    const prevHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
      previousFocus.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  const sheetClass =
    variant === "modal"
      ? "items-center justify-center p-3 sm:p-6"
      : variant === "sheet"
        ? "items-end justify-center sm:items-center sm:p-4"
        : "items-end justify-center md:items-center md:p-4";

  const panelMotion =
    variant === "modal"
      ? fitViewport
        ? "animate-scale-in rounded-[1.25rem]"
        : "animate-scale-in rounded-[1.5rem] max-h-[min(92dvh,100%)]"
      : variant === "sheet"
        ? "animate-sheet-in rounded-[2rem] sm:animate-scale-in sm:rounded-[1.5rem] max-h-[min(90dvh,100%)]"
        : "animate-sheet-in rounded-[2rem] md:animate-scale-in md:rounded-[1.5rem] max-h-[min(90dvh,100%)]";

  const onBackdrop = (e: MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const onBackdropKey = (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") onClose();
  };

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex",
        "bg-espresso/45 backdrop-blur-xl backdrop-saturate-150",
        "pt-[max(0.5rem,env(safe-area-inset-top))] pb-[max(0.5rem,env(safe-area-inset-bottom))]",
        "pl-[max(0.5rem,env(safe-area-inset-left))] pr-[max(0.5rem,env(safe-area-inset-right))]",
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
          "relative flex w-full max-w-md flex-col overflow-hidden bg-cream shadow-sheet",
          variant === "modal" && !fitViewport && "h-auto max-h-[min(92dvh,100%)]",
          variant === "modal" && fitViewport && "h-auto max-h-none",
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
        <div
          className={cn(
            "flex flex-col",
            fitViewport
              ? "overflow-hidden"
              : "min-h-0 flex-1 overflow-y-auto no-scrollbar overscroll-contain"
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
