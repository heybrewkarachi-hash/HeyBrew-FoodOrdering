"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { Toaster } from "sonner";
import { AuthProvider } from "@/hooks/useAuth";

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 15_000,
            retry: 1,
            refetchOnWindowFocus: true,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={client}>
      <AuthProvider>
        {children}
        <Toaster
          theme="light"
          position="top-right"
          toastOptions={{
            classNames: {
              toast: "border border-espresso/10 bg-cream-soft text-espresso shadow-soft",
            },
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  );
}
