"use client";

import { Coins, FileUp, Search, ScrollText } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { EmptyState, ErrorState, Skeleton } from "@/components/feedback/states";
import { Card, Input, PageHeader, buttonClassName } from "@/components/ui/primitives";
import { usePortfolioSummary } from "@/hooks/use-api";
import { formatQuantity } from "@/lib/numbers";

export function PortfolioView() {
  const portfolioQuery = usePortfolioSummary();
  const [search, setSearch] = useState("");
  const holdings = useMemo(
    () => (portfolioQuery.data?.assets ?? []).filter((holding) => holding.assetSymbol.toLowerCase().includes(search.trim().toLowerCase())),
    [portfolioQuery.data, search],
  );

  return (
    <>
      <PageHeader
        eyebrow="Quantity-only inventory"
        title="Current ledger holdings"
        description="Non-zero quantities derived by the backend from your ledger. No live price, market value, allocation, or unrealized profit is shown."
        action={<Link href="/app/ledger" className={buttonClassName({ variant: "secondary" })}><ScrollText className="size-4" aria-hidden="true" />View ledger</Link>}
      />

      <div className="mb-4 max-w-md">
        <label className="relative">
          <span className="sr-only">Search holdings</span>
          <Search className="pointer-events-none absolute left-3.5 top-3.5 size-4 text-white/30" aria-hidden="true" />
          <Input className="pl-10" placeholder="Search asset symbol" value={search} onChange={(event) => setSearch(event.target.value)} />
        </label>
      </div>

      {portfolioQuery.isPending && <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <Skeleton key={index} className="h-48" />)}</div>}
      {portfolioQuery.isError && <ErrorState error={portfolioQuery.error} onRetry={() => void portfolioQuery.refetch()} />}
      {portfolioQuery.data?.assets.length === 0 && (
        <EmptyState icon={Coins} title="No non-zero holdings are available" description="Upload a supported Binance or CoinDCX INR CSV to add transactions to the ledger." action={<Link href="/app/upload" className={buttonClassName({ size: "sm" })}><FileUp className="size-4" aria-hidden="true" />Upload CSV</Link>} />
      )}
      {portfolioQuery.data && portfolioQuery.data.assets.length > 0 && holdings.length === 0 && (
        <EmptyState title="No holding matches this asset" description="Try a different symbol or clear the search field." />
      )}
      {holdings.length > 0 && (
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-label="Holdings">
          {holdings.map((holding) => (
            <Card key={holding.assetSymbol} className="min-h-48 p-5">
              <div className="flex items-start justify-between">
                <div className="grid size-11 place-items-center rounded-full border border-lime/25 bg-lime/10 font-mono text-sm text-lime">{holding.assetSymbol.slice(0, 3)}</div>
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/30">Current ledger holding</span>
              </div>
              <h2 className="mt-8 text-xl text-white">{holding.assetSymbol}</h2>
              <p className="mt-2 break-all font-mono text-2xl tracking-[-0.04em] text-white/80">{formatQuantity(holding.quantity)}</p>
            </Card>
          ))}
        </section>
      )}
    </>
  );
}

