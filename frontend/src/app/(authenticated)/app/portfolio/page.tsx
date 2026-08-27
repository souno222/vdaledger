import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";

import { PortfolioView } from "@/features/portfolio/portfolio-view";

export const metadata: Metadata = { title: "Holdings" };

export default async function PortfolioPage() {
  await auth.protect();
  return <PortfolioView />;
}

