"use client";

import { Button } from "@/components/ui/primitives";

export default function RootError({
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <main className="grid min-h-screen place-items-center bg-forest px-4 text-center text-white">
      <div><p className="font-mono text-xs text-lime">ROUTE ERROR</p><h1 className="mt-4 text-3xl">This page could not be rendered.</h1><p className="mt-3 text-sm text-white/48">Retry the route. If the problem continues, check the application configuration.</p><Button className="mt-6" onClick={unstable_retry}>Try again</Button></div>
    </main>
  );
}

