import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";

import { DashboardView } from "@/features/dashboard/dashboard-view";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  await auth.protect();
  return <DashboardView />;
}

