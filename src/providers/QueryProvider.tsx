"use client";

/**
 * QueryProvider: envuelve la app con TanStack Query para habilitar:
 * - Caché client-side de datos (evita re-fetch al navegar hacia atrás)
 * - Background refetching (datos frescos sin bloquear UI)
 * - Deduplicación de requests idénticos en el mismo render
 * - DevTools en desarrollo para inspeccionar el estado del caché
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState, type ReactNode } from "react";

export function QueryProvider({ children }: { children: ReactNode }) {
  // useState para que cada usuario obtenga su propio QueryClient
  // (importante en SSR/múltiples tabs)
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Datos se consideran frescos por 30 segundos (no refetch automático)
            staleTime: 30 * 1000,
            // Mantener en caché por 5 minutos aunque no haya componentes suscritos
            gcTime: 5 * 60 * 1000,
            // No reintentar en errores del cliente (solo errores de red)
            retry: (failureCount, error) => {
              if (
                error instanceof Error &&
                error.message.includes("No autenticado")
              ) {
                return false;
              }
              return failureCount < 2;
            },
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
