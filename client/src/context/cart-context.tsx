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
import { useQuery } from "@tanstack/react-query";
import type { CartValidateInput } from "@heybrew/shared";
import { validateCart } from "@/lib/api";
import { cartLineKey } from "@/lib/cart-utils";
import { unitPriceForSelection } from "@/lib/demo-catalog";
import { STORAGE_KEYS, storageGet, storageSet } from "@/lib/storage";
import type { CartLineLocal, Product, ValidatedCart } from "@/lib/types";
import { useOrdering } from "./ordering-context";
import { useMenu } from "@/hooks/use-menu";

type CartContextValue = {
  items: CartLineLocal[];
  itemCount: number;
  couponCode: string | null;
  setCouponCode: (code: string | null) => void;
  addItem: (line: Omit<CartLineLocal, "key">) => void;
  updateQty: (key: string, quantity: number) => void;
  removeItem: (key: string) => void;
  clearCart: () => void;
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  validated: ValidatedCart | undefined;
  isValidating: boolean;
  revalidate: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { session } = useOrdering();
  const { data: menu } = useMenu();
  const [items, setItems] = useState<CartLineLocal[]>([]);
  const [couponCode, setCouponCodeState] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [revalidateToken, setRevalidateToken] = useState(0);

  useEffect(() => {
    setItems(storageGet<CartLineLocal[]>(STORAGE_KEYS.cart, []));
    setCouponCodeState(storageGet<string | null>(STORAGE_KEYS.coupon, null));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    storageSet(STORAGE_KEYS.cart, items);
  }, [items, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    storageSet(STORAGE_KEYS.coupon, couponCode);
  }, [couponCode, hydrated]);

  // Revalidate when location / order type changes
  useEffect(() => {
    if (!hydrated || !session.completed) return;
    setRevalidateToken((t) => t + 1);
  }, [
    session.type,
    session.branchId,
    session.deliveryZoneId,
    session.completed,
    hydrated,
  ]);

  const setCouponCode = useCallback((code: string | null) => {
    setCouponCodeState(code?.trim() ? code.trim().toUpperCase() : null);
  }, []);

  const addItem = useCallback((line: Omit<CartLineLocal, "key">) => {
    const key = cartLineKey(line);
    setItems((prev) => {
      const existing = prev.find((i) => i.key === key);
      if (existing) {
        return prev.map((i) =>
          i.key === key
            ? { ...i, quantity: Math.min(99, i.quantity + line.quantity) }
            : i
        );
      }
      return [...prev, { ...line, key }];
    });
    setDrawerOpen(true);
  }, []);

  const updateQty = useCallback((key: string, quantity: number) => {
    setItems((prev) => {
      if (quantity <= 0) return prev.filter((i) => i.key !== key);
      return prev.map((i) =>
        i.key === key ? { ...i, quantity: Math.min(99, quantity) } : i
      );
    });
  }, []);

  const removeItem = useCallback((key: string) => {
    setItems((prev) => prev.filter((i) => i.key !== key));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setCouponCodeState(null);
  }, []);

  const products: Product[] = menu?.products ?? [];

  const validateInput: CartValidateInput | null = useMemo(() => {
    if (!items.length || !session.branchId) return null;
    return {
      type: session.type,
      branchId: session.branchId,
      deliveryZoneId:
        session.type === "delivery" ? session.deliveryZoneId : null,
      items: items.map((i) => ({
        productId: i.productId,
        variantId: i.variantId,
        quantity: i.quantity,
        modifiers: i.modifiers.map((m) => ({
          groupId: m.groupId,
          optionId: m.optionId,
          name: m.name,
          priceDeltaMinor: m.priceDeltaMinor,
        })),
        notes: i.notes,
      })),
      couponCode,
    };
  }, [items, session, couponCode]);

  const {
    data: validated,
    isFetching: isValidating,
    refetch,
  } = useQuery({
    queryKey: [
      "cart-validate",
      validateInput,
      revalidateToken,
      products.map((p) => p.id).join(","),
    ],
    queryFn: () => validateCart(validateInput!, items, products),
    enabled: !!validateInput,
    staleTime: 10_000,
  });

  const itemCount = items.reduce((s, i) => s + i.quantity, 0);

  const value = useMemo(
    () => ({
      items,
      itemCount,
      couponCode,
      setCouponCode,
      addItem,
      updateQty,
      removeItem,
      clearCart,
      drawerOpen,
      setDrawerOpen,
      validated,
      isValidating,
      revalidate: () => {
        setRevalidateToken((t) => t + 1);
        void refetch();
      },
    }),
    [
      items,
      itemCount,
      couponCode,
      setCouponCode,
      addItem,
      updateQty,
      removeItem,
      clearCart,
      drawerOpen,
      validated,
      isValidating,
      refetch,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

export function buildLineFromProduct(
  product: Product,
  opts: {
    variantId?: string | null;
    modifiers: CartLineLocal["modifiers"];
    notes?: string | null;
    quantity: number;
  }
): Omit<CartLineLocal, "key"> {
  const unitPriceMinor = unitPriceForSelection(
    product,
    opts.variantId,
    opts.modifiers
  );
  return {
    productId: product.id,
    variantId: opts.variantId,
    quantity: opts.quantity,
    modifiers: opts.modifiers,
    notes: opts.notes?.trim() || null,
    name: product.name,
    imageUrl: product.imageUrl,
    unitPriceMinor,
  };
}
