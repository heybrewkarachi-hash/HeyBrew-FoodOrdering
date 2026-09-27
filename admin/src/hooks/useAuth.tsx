"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ApiError } from "@/lib/api";
import { getMe, logout as apiLogout, setUiAuthCookie } from "@/lib/admin-api";
import type { AdminUser } from "@/types";

type AuthState = {
  user: AdminUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: AdminUser | null) => void;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname === "/login";

  const refresh = useCallback(async () => {
    try {
      const me = await getMe();
      setUser(me);
      setUiAuthCookie(true);
    } catch (err) {
      setUser(null);
      setUiAuthCookie(false);
      if (err instanceof ApiError && err.status === 401 && !isLogin) {
        router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      }
    } finally {
      setLoading(false);
    }
  }, [isLogin, pathname, router]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    await apiLogout();
    setUser(null);
    router.replace("/login");
  }, [router]);

  const value = useMemo(
    () => ({ user, loading, refresh, logout, setUser }),
    [user, loading, refresh, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
