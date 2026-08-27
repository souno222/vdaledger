import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";

import { AppShell } from "@/components/layout/app-shell";

export const metadata: Metadata = {
  title: "Workspace",
  robots: { index: false, follow: false },
};

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await auth.protect();
  return <AppShell>{children}</AppShell>;
}

