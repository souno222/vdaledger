"use client";

import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/primitives";

export default function AppError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <div className="max-w-md rounded-2xl border border-danger/30 bg-danger/8 p-7 text-center">
        <AlertTriangle className="mx-auto size-5 text-red-200" aria-hidden="true" />
        <h1 className="mt-4 text-2xl text-white">The workspace hit an unexpected error</h1>
        <p className="mt-3 text-sm leading-6 text-white/50">{error.message || "Retry the current route."}</p>
        <Button className="mt-5" onClick={unstable_retry}>Try again</Button>
      </div>
    </div>
  );
}

