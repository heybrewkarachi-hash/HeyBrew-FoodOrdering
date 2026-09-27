"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { OrderType } from "@heybrew/shared";
import { STORAGE_KEYS, storageGet, storageRemove, storageSet } from "@/lib/storage";
import type { OrderingSession } from "@/lib/types";

const defaultSession: OrderingSession = {
  type: "delivery",
  branchId: null,
  deliveryZoneId: null,
  phone: null,
  rememberPhone: false,
  completed: false,
};

type OrderingContextValue = {
  session: OrderingSession;
  hydrated: boolean;
  setSession: (patch: Partial<OrderingSession>) => void;
  completeSetup: (next: OrderingSession) => void;
  openSetup: () => void;
  setupOpen: boolean;
  setSetupOpen: (open: boolean) => void;
  locationLabel: string | null;
  setLocationLabel: (label: string | null) => void;
};

const OrderingContext = createContext<OrderingContextValue | null>(null);

export function OrderingProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<OrderingSession>(defaultSession);
  const [hydrated, setHydrated] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);
  const [locationLabel, setLocationLabel] = useState<string | null>(null);

  useEffect(() => {
    const saved = storageGet<OrderingSession | null>(
      STORAGE_KEYS.orderingSession,
      null
    );
    if (saved?.completed) {
      setSessionState({
        ...defaultSession,
        ...saved,
        phone: saved.rememberPhone ? saved.phone : null,
      });
      setSetupOpen(false);
    } else {
      setSetupOpen(true);
    }
    setHydrated(true);
  }, []);

  const setSession = useCallback((patch: Partial<OrderingSession>) => {
    setSessionState((prev) => {
      const next = { ...prev, ...patch };
      storageSet(STORAGE_KEYS.orderingSession, next);
      return next;
    });
  }, []);

  const completeSetup = useCallback((next: OrderingSession) => {
    const toStore: OrderingSession = {
      ...next,
      completed: true,
      phone: next.rememberPhone ? next.phone : null,
    };
    setSessionState(toStore);
    storageSet(STORAGE_KEYS.orderingSession, toStore);
    setSetupOpen(false);
  }, []);

  const openSetup = useCallback(() => setSetupOpen(true), []);

  const value = useMemo(
    () => ({
      session,
      hydrated,
      setSession,
      completeSetup,
      openSetup,
      setupOpen,
      setSetupOpen,
      locationLabel,
      setLocationLabel,
    }),
    [
      session,
      hydrated,
      setSession,
      completeSetup,
      openSetup,
      setupOpen,
      locationLabel,
    ]
  );

  return (
    <OrderingContext.Provider value={value}>{children}</OrderingContext.Provider>
  );
}

export function useOrdering() {
  const ctx = useContext(OrderingContext);
  if (!ctx) throw new Error("useOrdering must be used within OrderingProvider");
  return ctx;
}

export function clearOrderingSession() {
  storageRemove(STORAGE_KEYS.orderingSession);
}

export function orderTypeLabel(type: OrderType): string {
  return type === "delivery" ? "Delivery" : "Pick-Up";
}
