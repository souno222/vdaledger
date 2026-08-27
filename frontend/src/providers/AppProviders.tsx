"use client";

import { useAuth } from "@clerk/nextjs";
import {
  QueryClient,
  QueryClientProvider,
  useQueryClient,
} from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Toaster } from "sonner";

import { isApiClientError } from "@/lib/api/api-error";

function shouldRetry(failureCount: number, error: unknown) {
  if (
    isApiClientError(error) &&
    [400, 401, 403, 404, 409, 422, 429].includes(error.status)
  ) {
    return false;
  }
  return failureCount < 1;
}

function IdentityCacheBoundary() {
  const { isLoaded, userId } = useAuth();
  const queryClient = useQueryClient();
  const previousUserId = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (!isLoaded) return;

    if (previousUserId.current === undefined) {
      previousUserId.current = userId;
      return;
    }

    if (previousUserId.current !== userId) {
      queryClient.clear();
      previousUserId.current = userId;
    }
  }, [isLoaded, queryClient, userId]);

  return null;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: shouldRetry,
            refetchOnWindowFocus: false,
          },
          mutations: { retry: false },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <IdentityCacheBoundary />
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          classNames: {
            toast: "!border-white/15 !bg-secondary !text-foreground",
            description: "!text-foreground/70",
          },
        }}
      />
    </QueryClientProvider>
  );
}
