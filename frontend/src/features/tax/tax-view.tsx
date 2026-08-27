"use client";

import { AlertTriangle, CalendarRange, Scale } from "lucide-react";
import { useRouter } from "next/navigation";

import { ErrorState, Skeleton } from "@/components/feedback/states";
import { Card, GradientShell, PageHeader, Select } from "@/components/ui/primitives";
import { useTaxReport } from "@/hooks/use-api";
import {
  supportedFinancialYears,
  type SupportedFinancialYear,
} from "@/lib/api/endpoints/tax";
import { formatShortDate } from "@/lib/dates";
import { formatInr, formatRate } from "@/lib/numbers";
import { humanizeCode } from "@/lib/status";

export function TaxView({ financialYear }: { financialYear: SupportedFinancialYear }) {
  const router = useRouter();
  const taxQuery = useTaxReport(financialYear);

  const changeYear = (nextYear: SupportedFinancialYear) => {
    router.replace(`/app/tax?financialYear=${encodeURIComponent(nextYear)}`);
  };

  return (
    <>
      <PageHeader
        eyebrow="Backend-calculated report"
        title="Estimated VDA tax"
        description="Select a supported Indian financial year. All gains, FIFO matching, exclusions, and tax values come directly from the Spring Boot backend."
        action={
          <label className="min-w-48">
            <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.12em] text-white/40">Financial year</span>
            <Select
              value={financialYear}
              onChange={(event) =>
                changeYear(event.target.value as SupportedFinancialYear)
              }
            >
              {supportedFinancialYears.map((year) => <option key={year}>{year}</option>)}
            </Select>
          </label>
        }
      />

      {taxQuery.isPending && <><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-36" />)}</div><Skeleton className="mt-3 h-96" /></>}
      {taxQuery.isError && <ErrorState error={taxQuery.error} onRetry={() => void taxQuery.refetch()} />}
      {taxQuery.data && (
        <>
          <GradientShell innerClassName="p-3">
            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Tax summary">
              {[
                ["Gross positive VDA income", formatInr(taxQuery.data.grossPositiveIncome)],
                ["Excluded losses", formatInr(taxQuery.data.excludedLosses)],
                ["Base VDA tax", formatInr(taxQuery.data.baseVdaTax)],
                ["Estimated total tax", formatInr(taxQuery.data.estimatedTotalTax)],
                ["Applicable surcharge", taxQuery.data.applicableSurcharge === null ? "Not calculated" : formatInr(taxQuery.data.applicableSurcharge)],
                ["Health & Education Cess", formatInr(taxQuery.data.healthAndEducationCess)],
                ["Processed sell events", String(taxQuery.data.processedSellEvents)],
                [
                  "Report period",
                  `${formatShortDate(taxQuery.data.periodStart)} to before ${formatShortDate(taxQuery.data.periodEndExclusive)}`,
                ],
              ].map(([label, value]) => (
                <Card key={label} className="min-h-32">
                  <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-white/38">{label}</p>
                  <p className="mt-5 text-xl tracking-[-0.03em] text-white">{value}</p>
                </Card>
              ))}
            </section>
          </GradientShell>

          <div className="mt-3 grid gap-3 xl:grid-cols-[1.15fr_0.85fr]">
            <Card>
              <div className="mb-5 flex items-center gap-2">
                <Scale className="size-4 text-lime" aria-hidden="true" />
                <h2 className="text-lg text-white">Rule metadata</h2>
              </div>
              <dl className="grid gap-x-8 sm:grid-cols-2">
                {[
                  ["Tax rate", formatRate(taxQuery.data.rules.taxRate)],
                  ["TDS rate", formatRate(taxQuery.data.rules.tdsRate)],
                  ["Specified-person threshold", formatInr(taxQuery.data.rules.specifiedPersonTdsThreshold)],
                  ["Other-person threshold", formatInr(taxQuery.data.rules.otherPersonTdsThreshold)],
                  ["Loss-offset policy", humanizeCode(taxQuery.data.rules.lossOffsetPolicy)],
                  ["Allowed deduction", humanizeCode(taxQuery.data.rules.allowedDeductionPolicy)],
                  ["Cess rate", formatRate(taxQuery.data.rules.cessRate)],
                  ["Statutory reference", taxQuery.data.rules.statutoryReference],
                ].map(([term, detail]) => (
                  <div key={term} className="border-b border-white/8 py-4">
                    <dt className="text-xs text-white/35">{term}</dt>
                    <dd className="mt-1.5 text-sm leading-6 text-white/72">{detail}</dd>
                  </div>
                ))}
              </dl>
            </Card>

            <div className="space-y-3">
              <Card tone="lime">
                <div className="flex gap-3">
                  <CalendarRange className="mt-0.5 size-4 shrink-0 text-lime" aria-hidden="true" />
                  <div>
                    <h2 className="text-sm font-medium text-white">Selected financial year</h2>
                    <p className="mt-1 text-sm leading-6 text-white/52">{taxQuery.data.financialYear} stays in the URL for refresh, back navigation, and sharing.</p>
                  </div>
                </div>
              </Card>
              <Card className="border-warning/25 bg-warning/8">
                <div className="flex gap-3">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
                  <div>
                    <h2 className="text-sm font-medium text-amber-50">Important estimate notes</h2>
                    <ul className="mt-3 space-y-2 text-sm leading-6 text-amber-50/65">
                      {taxQuery.data.warnings.map((warning) => <li key={warning}>• {warning}</li>)}
                      <li>• This is an estimated tax calculation and is not financial, legal, or tax-filing advice.</li>
                    </ul>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </>
      )}
    </>
  );
}

