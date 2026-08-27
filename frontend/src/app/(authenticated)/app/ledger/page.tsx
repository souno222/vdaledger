import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";

import { LedgerView } from "@/features/ledger/ledger-view";

export const metadata: Metadata = { title: "Ledger" };

export default async function LedgerPage() {
  await auth.protect();
  return <LedgerView />;
}

