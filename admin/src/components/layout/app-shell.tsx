"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { navForRole, roleLabel } from "@/lib/roles";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  if (pathname === "/login") {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-espresso border-r-transparent" />
          <p className="mt-3 text-sm text-espresso/60">Loading admin…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const items = navForRole(user.role);

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#FFFBF5_0%,_#F7F3EC_45%,_#EDE6DA_100%)]">
      <div className="mx-auto flex min-h-screen max-w-[1400px]">
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 w-64 border-r border-espresso/10 bg-espresso text-cream-soft transition-transform lg:static lg:translate-x-0",
            open ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="flex h-full flex-col">
            <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
              <Image
                src="/brand/heybrew-logo.jpg"
                alt="HeyBrew"
                width={44}
                height={44}
                className="rounded-md object-cover"
                priority
              />
              <div>
                <p className="font-display text-xl leading-none">HeyBrew</p>
                <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-caramel-soft">
                  Admin
                </p>
              </div>
              <button
                type="button"
                className="ml-auto rounded p-1 text-cream-soft/70 hover:bg-white/10 lg:hidden"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto p-3">
              {items.map((item) => {
                const active =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "block rounded-md px-3 py-2.5 text-sm transition",
                      active
                        ? "bg-caramel/90 text-cream-soft"
                        : "text-cream-soft/75 hover:bg-white/10 hover:text-cream-soft"
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="border-t border-white/10 p-4">
              <p className="truncate text-sm font-medium">{user.name}</p>
              <p className="truncate text-xs text-cream-soft/55">{user.email}</p>
              <p className="mt-1 text-[11px] uppercase tracking-wider text-caramel-soft">
                {roleLabel(user.role)}
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-3 w-full justify-start text-cream-soft/80 hover:bg-white/10 hover:text-cream-soft"
                onClick={() => void logout()}
              >
                <LogOut className="h-4 w-4" />
                Log out
              </Button>
            </div>
          </div>
        </aside>

        {open ? (
          <button
            type="button"
            className="fixed inset-0 z-30 bg-espresso/40 lg:hidden"
            aria-label="Close overlay"
            onClick={() => setOpen(false)}
          />
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-espresso/10 bg-cream-soft/80 px-4 py-3 backdrop-blur lg:hidden">
            <button
              type="button"
              className="rounded-md border border-espresso/15 p-2 text-espresso"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <Image
                src="/brand/heybrew-logo.jpg"
                alt="HeyBrew"
                width={28}
                height={28}
                className="rounded object-cover"
              />
              <span className="font-display text-lg text-espresso">HeyBrew Admin</span>
            </div>
          </header>
          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
