"use client";

import { FileUp, Search, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { EmptyState, ErrorState, Skeleton } from "@/components/feedback/states";
import { Badge, Card, Input, PageHeader, Select, TableShell, buttonClassName } from "@/components/ui/primitives";
import { useLedgerEvents } from "@/hooks/use-api";
import { formatDateTime } from "@/lib/dates";
import { formatInr, formatQuantity } from "@/lib/numbers";
import { ledgerEventLabels } from "@/lib/status";

export function LedgerView() {
  const ledgerQuery = useLedgerEvents();
  const [asset, setAsset] = useState("");
  const [eventType, setEventType] = useState("ALL");
  const [exchange, setExchange] = useState("ALL");
  const [sort, setSort] = useState("NEWEST");

  const filteredEvents = useMemo(() => {
    const events = ledgerQuery.data ?? [];
    return events
      .filter((event) => event.assetSymbol.toLowerCase().includes(asset.trim().toLowerCase()))
      .filter((event) => eventType === "ALL" || event.eventType === eventType)
      .filter((event) => exchange === "ALL" || event.exchange === exchange)
      .slice()
      .sort((a, b) =>
        sort === "NEWEST"
          ? new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
          : new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime(),
      );
  }, [asset, eventType, exchange, ledgerQuery.data, sort]);

  const clearFilters = () => {
    setAsset("");
    setEventType("ALL");
    setExchange("ALL");
    setSort("NEWEST");
  };

  return (
    <>
      <PageHeader
        eyebrow="Read-only events"
        title="Ledger"
        description="Normalized BUY and SELL transactions returned by the backend. Values are displayed, never recalculated in the browser."
        action={<Link href="/app/upload" className={buttonClassName()}><FileUp className="size-4" aria-hidden="true" />Upload CSV</Link>}
      />

      <Card className="mb-3">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1.4fr_0.7fr_0.7fr_0.8fr_auto]">
          <label className="relative">
            <span className="sr-only">Search asset</span>
            <Search className="pointer-events-none absolute left-3.5 top-3.5 size-4 text-white/30" aria-hidden="true" />
            <Input className="pl-10" placeholder="Search asset symbol" value={asset} onChange={(event) => setAsset(event.target.value)} />
          </label>
          <label>
            <span className="sr-only">Event type</span>
            <Select value={eventType} onChange={(event) => setEventType(event.target.value)}>
              <option value="ALL">All types</option><option value="BUY">Buy</option><option value="SELL">Sell</option>
            </Select>
          </label>
          <label>
            <span className="sr-only">Exchange</span>
            <Select value={exchange} onChange={(event) => setExchange(event.target.value)}>
              <option value="ALL">All exchanges</option><option value="BINANCE">Binance</option><option value="COINDCX">CoinDCX</option>
            </Select>
          </label>
          <label>
            <span className="sr-only">Date sorting</span>
            <Select value={sort} onChange={(event) => setSort(event.target.value)}>
              <option value="NEWEST">Newest first</option><option value="OLDEST">Oldest first</option>
            </Select>
          </label>
          <button type="button" className={buttonClassName({ variant: "ghost" })} onClick={clearFilters}>
            <SlidersHorizontal className="size-4" aria-hidden="true" />Clear
          </button>
        </div>
      </Card>

      <Card>
        {ledgerQuery.isPending && <Skeleton className="h-[480px]" />}
        {ledgerQuery.isError && <ErrorState error={ledgerQuery.error} onRetry={() => void ledgerQuery.refetch()} />}
        {ledgerQuery.data?.length === 0 && (
          <EmptyState title="Your ledger is empty" description="Import a supported Binance or CoinDCX CSV to add transactions." action={<Link href="/app/upload" className={buttonClassName({ size: "sm" })}>Upload CSV</Link>} />
        )}
        {ledgerQuery.data && ledgerQuery.data.length > 0 && filteredEvents.length === 0 && (
          <EmptyState title="No events match these filters" description="Clear or adjust the asset, type, exchange, and date order filters." />
        )}
        {filteredEvents.length > 0 && (
          <>
            <div className="hidden md:block">
              <TableShell>
                <thead className="data-table"><tr><th>Date</th><th>Asset</th><th>Type</th><th>Quantity</th><th>Gross INR</th><th>Exchange</th><th>Source row</th></tr></thead>
                <tbody className="data-table">
                  {filteredEvents.map((event) => (
                    <tr key={event.id}>
                      <td>{formatDateTime(event.occurredAt)}</td>
                      <td className="font-medium !text-white">{event.assetSymbol}</td>
                      <td><Badge className={event.eventType === "BUY" ? "border-lime/30 text-lime" : "border-warning/30 text-amber-100"}>{ledgerEventLabels[event.eventType]}</Badge></td>
                      <td className="font-mono">{formatQuantity(event.quantity)}</td>
                      <td className="font-mono">{formatInr(event.grossValueInr)}</td>
                      <td>{event.exchange}</td>
                      <td>{event.sourceRowNumber ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </TableShell>
            </div>
            <div className="grid gap-2 md:hidden">
              {filteredEvents.map((event) => (
                <article key={event.id} className="rounded-xl border border-white/10 bg-black/10 p-4">
                  <div className="flex items-start justify-between">
                    <div><p className="text-lg text-white">{event.assetSymbol}</p><p className="mt-1 text-xs text-white/35">{formatDateTime(event.occurredAt)}</p></div>
                    <Badge className={event.eventType === "BUY" ? "border-lime/30 text-lime" : "border-warning/30 text-amber-100"}>{ledgerEventLabels[event.eventType]}</Badge>
                  </div>
                  <dl className="mt-5 grid grid-cols-2 gap-4 text-xs">
                    <div><dt className="text-white/35">Quantity</dt><dd className="mt-1 font-mono text-white/70">{formatQuantity(event.quantity)}</dd></div>
                    <div><dt className="text-white/35">Gross INR</dt><dd className="mt-1 font-mono text-white/70">{formatInr(event.grossValueInr)}</dd></div>
                    <div><dt className="text-white/35">Exchange</dt><dd className="mt-1 text-white/70">{event.exchange}</dd></div>
                    <div><dt className="text-white/35">Source row</dt><dd className="mt-1 text-white/70">{event.sourceRowNumber ?? "—"}</dd></div>
                  </dl>
                </article>
              ))}
            </div>
          </>
        )}
      </Card>
    </>
  );
}

