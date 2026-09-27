"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { OrderingProvider } from "@/context/ordering-context";
import { CartProvider } from "@/context/cart-context";
import { UiProvider } from "@/context/ui-context";
import { OrderingSetupModal } from "@/components/ordering/ordering-setup-modal";
import { ProductDetailModal } from "@/components/product/product-detail-modal";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { StickyCartBar } from "@/components/layout/sticky-cart-bar";
import { WhatsAppFab } from "@/components/layout/whatsapp-fab";

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={client}>
      <OrderingProvider>
        <UiProvider>
          <CartProvider>
            {children}
            <OrderingSetupModal />
            <ProductDetailModal />
            <CartDrawer />
            <StickyCartBar />
            <WhatsAppFab />
          </CartProvider>
        </UiProvider>
      </OrderingProvider>
    </QueryClientProvider>
  );
}
