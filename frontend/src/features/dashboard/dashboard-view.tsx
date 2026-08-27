"use client";

import { useUser } from "@clerk/nextjs";
import {
  ArrowUpRight,
  FileClock,
  FileUp,
  ReceiptIndianRupee,
  ScrollText,
  WalletCards,
} from "lucide-react";
import Link from "next/link";

import { EmptyState, ErrorState, Skeleton } from "@/components/feedback/states";
import {
  Badge,
  Card,
  GradientShell,
  PageHeader,
  StatCard,
  StatusBadge,
  buttonClassName,
} from "@/components/ui/primitives";
import {
  useIngestionHistory,
  useLedgerEvents,
  usePortfolioSummary,
  useTaxReport,
} from "@/hooks/use-api";
import { defaultFinancialYear } from "@/lib/api/endpoints/tax";
import { formatDateTime } from "@/lib/dates";
import { formatInr, formatQuantity } from "@/lib/numbers";
import { ledgerEventLabels } from "@/lib/status";

function SectionHeading({
  title,
  href,
  linkLabel,
}: {
  title: string;
  href: string;
  linkLabel: string;
}) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="text-lg tracking-[-0.03em] text-white">{title}</h2>
      <Link className="inline-flex items-center gap-1 text-xs text-lime hover:brightness-110" href={href}>
        {linkLabel}
        <ArrowUpRight className="size-3.5" aria-hidden="true" />
      </Link>
    </div>
  );
}

export function DashboardView() {
  const { user } = useUser();
  const ingestionsQuery = useIngestionHistory();
  const ledgerQuery = useLedgerEvents();
  const portfolioQuery = usePortfolioSummary();
  const taxQuery = useTaxReport(defaultFinancialYear);

  const recentLedger = ledgerQuery.data?.slice(-5).reverse() ?? [];

  return (
    <>
      <PageHeader
        eyebrow="Overview"
        title={
          user?.primaryEmailAddress?.emailAddress
            ? `Welcome back, ${user.primaryEmailAddress.emailAddress.split("@")[0]}`
            : "Your ledger at a glance"
        }
        description="Independent backend snapshots for ingestion, ledger activity, quantity holdings, and the selected financial-year estimate."
        action={
          <Link href="/app/upload" className={buttonClassName()}>
            <FileUp className="size-4" aria-hidden="true" />
            Upload CSV
          </Link>
        }
      />

      <GradientShell innerClassName="p-3">
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Summary">
          <StatCard
            label="Non-zero holdings"
            value={
              portfolioQuery.isPending ? <Skeleton className="h-9 w-16" /> : portfolioQuery.data?.assets.length ?? "—"
            }
            detail={portfolioQuery.isError ? "Holdings unavailable" : "Quantity-only assets"}
            icon={WalletCards}
            error={portfolioQuery.isError}
          />
          <StatCard
            label="Ledger events"
            value={
              ledgerQuery.isPending ? <Skeleton className="h-9 w-16" /> : ledgerQuery.data?.length ?? "—"
            }
            detail={ledgerQuery.isError ? "Ledger unavailable" : "Normalized BUY and SELL events"}
            icon={ScrollText}
            error={ledgerQuery.isError}
          />
          <StatCard
            label="Ingestion jobs"
            value={
              ingestionsQuery.isPending ? <Skeleton className="h-9 w-16" /> : ingestionsQuery.data?.length ?? "—"
            }
            detail={ingestionsQuery.isError ? "History unavailable" : "Newest jobs shown below"}
            icon={FileClock}
            error={ingestionsQuery.isError}
          />
          <StatCard
            label={`Estimated tax · ${defaultFinancialYear}`}
            value={
              taxQuery.isPending ? <Skeleton className="h-9 w-32" /> : taxQuery.data ? formatInr(taxQuery.data.estimatedTotalTax) : "—"
            }
            detail={taxQuery.isError ? "Tax report unavailable" : "Backend estimate · not filing advice"}
            icon={ReceiptIndianRupee}
            error={taxQuery.isError}
          />
        </section>
      </GradientShell>

      <div className="mt-6 grid gap-3 xl:grid-cols-[1.18fr_0.82fr]">
        <Card className="min-h-[360px]">
          <SectionHeading title="Recent ingestions" href="/app/ingestions" linkLabel="View history" />
          {ingestionsQuery.isPending && <Skeleton className="h-64" />}
          {ingestionsQuery.isError && (
            <ErrorState compact error={ingestionsQuery.error} onRetry={() => void ingestionsQuery.refetch()} />
          )}
          {ingestionsQuery.data?.length === 0 && (
            <EmptyState
              icon={FileUp}
              title="No CSV files have been uploaded yet"
              description="Upload your first Binance or CoinDCX INR CSV to begin the ledger."
              action={<Link href="/app/upload" className={buttonClassName({ size: "sm" })}>Upload your first CSV</Link>}
            />
          )}
          {ingestionsQuery.data && ingestionsQuery.data.length > 0 && (
            <div className="divide-y divide-white/8">
              {ingestionsQuery.data.slice(0, 5).map((job) => (
                <Link
                  key={job.jobId}
                  href={`/app/ingestions/${job.jobId}`}
                  className="grid gap-3 py-4 transition hover:bg-white/[0.025] sm:grid-cols-[1fr_auto] sm:items-center"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm text-white/78">{job.originalFileName}</p>
                    <p className="mt-1 text-xs text-white/35">
                      {job.exchange} · {formatDateTime(job.createdAt)} · {job.importedRows} imported
                    </p>
                  </div>
                  <StatusBadge status={job.status} />
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <SectionHeading title="Current holdings" href="/app/portfolio" linkLabel="View holdings" />
          {portfolioQuery.isPending && <Skeleton className="h-64" />}
          {portfolioQuery.isError && (
            <ErrorState compact error={portfolioQuery.error} onRetry={() => void portfolioQuery.refetch()} />
          )}
          {portfolioQuery.data?.assets.length === 0 && (
            <EmptyState title="No non-zero holdings" description="Holdings appear after supported trades enter the ledger." />
          )}
          {portfolioQuery.data && portfolioQuery.data.assets.length > 0 && (
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
              {portfolioQuery.data.assets.slice(0, 6).map((holding) => (
                <div key={holding.assetSymbol} className="flex items-center justify-between rounded-xl border border-white/8 bg-black/10 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="grid size-8 place-items-center rounded-full bg-lime/12 font-mono text-[10px] text-lime">
                      {holding.assetSymbol.slice(0, 2)}
                    </span>
                    <span className="text-sm text-white/70">{holding.assetSymbol}</span>
                  </div>
                  <span className="font-mono text-xs text-white/72">{formatQuantity(holding.quantity)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="mt-3 grid gap-3 xl:grid-cols-[1.18fr_0.82fr]">
        <Card>
          <SectionHeading title="Recent ledger events" href="/app/ledger" linkLabel="Open ledger" />
          {ledgerQuery.isPending && <Skeleton className="h-56" />}
          {ledgerQuery.isError && (
            <ErrorState compact error={ledgerQuery.error} onRetry={() => void ledgerQuery.refetch()} />
          )}
          {ledgerQuery.data?.length === 0 && (
            <EmptyState title="Your ledger is empty" description="Import a supported exchange CSV to add normalized transactions." />
          )}
          {recentLedger.length > 0 && (
            <div className="divide-y divide-white/8">
              {recentLedger.map((event) => (
                <div key={event.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 py-3">
                  <Badge className={event.eventType === "BUY" ? "border-lime/30 text-lime" : "border-warning/30 text-amber-100"}>
                    {ledgerEventLabels[event.eventType]}
                  </Badge>
                  <div>
                    <p className="text-sm text-white/72">{event.assetSymbol} · <span className="font-mono">{formatQuantity(event.quantity)}</span></p>
                    <p className="mt-1 text-xs text-white/32">{formatDateTime(event.occurredAt)} · {event.exchange}</p>
                  </div>
                  <span className="font-mono text-xs text-white/60">{formatInr(event.grossValueInr)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card tone="lime">
          <h2 className="text-lg tracking-[-0.03em]">Continue your record trail</h2>
          <p className="mt-2 text-sm leading-6 text-white/48">Choose a direct action. Each opens the underlying record view—no shortcut calculations.</p>
          <div className="mt-6 grid gap-2">
            {([
              ["/app/upload", "Upload an exchange CSV", FileUp],
              ["/app/tax", "View tax estimate", ReceiptIndianRupee],
              ["/app/ingestions", "Review ingestion history", FileClock],
            ] as const).map(([href, label, Icon]) => (
              <Link key={String(href)} href={String(href)} className="flex min-h-12 items-center justify-between rounded-xl border border-white/12 bg-forest/45 px-4 text-sm text-white/70 hover:border-lime/35 hover:text-white">
                <span className="flex items-center gap-3">
                  <Icon className="size-4 text-lime" aria-hidden="true" />
                  {String(label)}
                </span>
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}



