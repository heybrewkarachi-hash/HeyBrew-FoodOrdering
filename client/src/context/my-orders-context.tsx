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
import { STORAGE_KEYS, storageGet, storageSet } from "@/lib/storage";

export type SavedOrderRef = {
  orderId: string;
  orderNumber: string;
  accessToken: string;
  createdAt: string;
  /** Optional display name from checkout */
  customerName?: string;
};

type MyOrdersContextValue = {
  orders: SavedOrderRef[];
  hydrated: boolean;
  /** Order shown in the floating dock (most recent active by default) */
  focusedOrderId: string | null;
  dockExpanded: boolean;
  addOrder: (order: SavedOrderRef) => void;
  removeOrder: (orderId: string) => void;
  focusOrder: (orderId: string | null) => void;
  setDockExpanded: (open: boolean) => void;
  getOrder: (orderId: string) => SavedOrderRef | undefined;
};

const MyOrdersContext = createContext<MyOrdersContextValue | null>(null);

export function MyOrdersProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<SavedOrderRef[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [focusedOrderId, setFocusedOrderId] = useState<string | null>(null);
  const [dockExpanded, setDockExpanded] = useState(false);

  useEffect(() => {
    const saved = storageGet<SavedOrderRef[]>(STORAGE_KEYS.myOrders, []);
    setOrders(Array.isArray(saved) ? saved : []);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    storageSet(STORAGE_KEYS.myOrders, orders);
  }, [orders, hydrated]);

  const addOrder = useCallback((order: SavedOrderRef) => {
    setOrders((prev) => {
      const without = prev.filter(
        (o) => o.orderId !== order.orderId && o.orderNumber !== order.orderNumber
      );
      return [order, ...without].slice(0, 20);
    });
    setFocusedOrderId(order.orderId);
    setDockExpanded(true);
  }, []);

  const removeOrder = useCallback((orderId: string) => {
    setOrders((prev) => prev.filter((o) => o.orderId !== orderId));
    setFocusedOrderId((current) => (current === orderId ? null : current));
  }, []);

  const focusOrder = useCallback((orderId: string | null) => {
    setFocusedOrderId(orderId);
    if (orderId) setDockExpanded(true);
  }, []);

  const getOrder = useCallback(
    (orderId: string) => orders.find((o) => o.orderId === orderId),
    [orders]
  );

  const value = useMemo(
    () => ({
      orders,
      hydrated,
      focusedOrderId,
      dockExpanded,
      addOrder,
      removeOrder,
      focusOrder,
      setDockExpanded,
      getOrder,
    }),
    [
      orders,
      hydrated,
      focusedOrderId,
      dockExpanded,
      addOrder,
      removeOrder,
      focusOrder,
      getOrder,
    ]
  );

  return (
    <MyOrdersContext.Provider value={value}>{children}</MyOrdersContext.Provider>
  );
}

export function useMyOrders() {
  const ctx = useContext(MyOrdersContext);
  if (!ctx) throw new Error("useMyOrders must be used within MyOrdersProvider");
  return ctx;
}
