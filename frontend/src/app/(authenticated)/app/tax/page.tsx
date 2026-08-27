import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";

import { TaxView } from "@/features/tax/tax-view";
import {
  defaultFinancialYear,
  supportedFinancialYears,
  type SupportedFinancialYear,
} from "@/lib/api/endpoints/tax";

export const metadata: Metadata = { title: "Tax estimate" };

export default async function TaxPage({
  searchParams,
}: {
  searchParams: Promise<{ financialYear?: string | string[] }>;
}) {
  await auth.protect();
  const rawYear = (await searchParams).financialYear;
  const candidate = Array.isArray(rawYear) ? rawYear[0] : rawYear;
  const financialYear: SupportedFinancialYear = supportedFinancialYears.includes(
    candidate as SupportedFinancialYear,
  )
    ? (candidate as SupportedFinancialYear)
    : defaultFinancialYear;

  return <TaxView financialYear={financialYear} />;
}

