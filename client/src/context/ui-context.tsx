"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Product } from "@/lib/types";

type UiContextValue = {
  selectedProduct: Product | null;
  openProduct: (product: Product) => void;
  closeProduct: () => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
};

const UiContext = createContext<UiContextValue | null>(null);

export function UiProvider({ children }: { children: ReactNode }) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const value = useMemo(
    () => ({
      selectedProduct,
      openProduct: (p: Product) => setSelectedProduct(p),
      closeProduct: () => setSelectedProduct(null),
      mobileMenuOpen,
      setMobileMenuOpen,
    }),
    [selectedProduct, mobileMenuOpen]
  );

  return <UiContext.Provider value={value}>{children}</UiContext.Provider>;
}

export function useUi() {
  const ctx = useContext(UiContext);
  if (!ctx) throw new Error("useUi must be used within UiProvider");
  return ctx;
}
