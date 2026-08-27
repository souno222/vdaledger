"use client";

import { FileUp, Search, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { EmptyState, ErrorState, Skeleton } from "@/components/feedback/states";
import { Card, Input, PageHeader, Select, StatusBadge, TableShell, buttonClassName } from "@/components/ui/primitives";
import { useIngestionHistory } from "@/hooks/use-api";
import type { IngestionStatus } from "@/lib/api/types";
import { formatDateTime } from "@/lib/dates";

export function HistoryView() {
  const historyQuery = useIngestionHistory();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"ALL" | IngestionStatus>("ALL");

  const jobs = useMemo(
    () => (historyQuery.data ?? [])
      .filter((job) => job.originalFileName.toLowerCase().includes(search.trim().toLowerCase()))
      .filter((job) => status === "ALL" || job.status === status),
    [historyQuery.data, search, status],
  );

  return (
    <>
      <PageHeader
        eyebrow="Import record"
        title="Ingestion history"
        description="Newest-first Binance and CoinDCX CSV jobs with backend row counters and lifecycle status."
        action={<Link href="/app/upload" className={buttonClassName()}><FileUp className="size-4" aria-hidden="true" />Upload CSV</Link>}
      />

      <Card className="mb-3">
        <div className="grid gap-3 md:grid-cols-[1fr_16rem_auto]">
          <label className="relative">
            <span className="sr-only">Search filename</span>
            <Search className="pointer-events-none absolute left-3.5 top-3.5 size-4 text-white/30" aria-hidden="true" />
            <Input className="pl-10" placeholder="Search filename" value={search} onChange={(event) => setSearch(event.target.value)} />
          </label>
          <label>
            <span className="sr-only">Filter by status</span>
            <Select value={status} onChange={(event) => setStatus(event.target.value as "ALL" | IngestionStatus)}>
              <option value="ALL">All statuses</option>
              <option value="PENDING">Pending</option><option value="PROCESSING">Processing</option><option value="COMPLETED">Completed</option><option value="COMPLETED_WITH_ERRORS">Completed with errors</option><option value="FAILED">Failed</option>
            </Select>
          </label>
          <button type="button" className={buttonClassName({ variant: "ghost" })} onClick={() => { setSearch(""); setStatus("ALL"); }}>
            <SlidersHorizontal className="size-4" aria-hidden="true" />Clear
          </button>
        </div>
      </Card>

      <Card>
        {historyQuery.isPending && <Skeleton className="h-[480px]" />}
        {historyQuery.isError && <ErrorState error={historyQuery.error} onRetry={() => void historyQuery.refetch()} />}
        {historyQuery.data?.length === 0 && <EmptyState title="No CSV files have been uploaded yet" description="Upload your first supported Binance or CoinDCX INR CSV to begin." action={<Link href="/app/upload" className={buttonClassName({ size: "sm" })}>Upload your first CSV</Link>} />}
        {historyQuery.data && historyQuery.data.length > 0 && jobs.length === 0 && <EmptyState title="No jobs match these filters" description="Change the filename or status filter, or clear both." />}
        {jobs.length > 0 && (
          <>
            <div className="hidden lg:block">
              <TableShell>
                <thead className="data-table"><tr><th>Filename</th><th>Exchange</th><th>Status</th><th>Total</th><th>Imported</th><th>Rejected</th><th>Duplicates</th><th>Created</th><th>Completed</th><th><span className="sr-only">Action</span></th></tr></thead>
                <tbody className="data-table">
                  {jobs.map((job) => (
                    <tr key={job.jobId}>
                      <td className="max-w-56 truncate !text-white">{job.originalFileName}</td><td>{job.exchange}</td><td><StatusBadge status={job.status} /></td><td>{job.totalRows}</td><td>{job.importedRows}</td><td>{job.failedRows}</td><td>{job.duplicateRows}</td><td>{formatDateTime(job.createdAt)}</td><td>{formatDateTime(job.completedAt)}</td><td><Link className="text-xs text-lime hover:underline" href={`/app/ingestions/${job.jobId}`}>Details</Link></td>
                    </tr>
                  ))}
                </tbody>
              </TableShell>
            </div>
            <div className="grid gap-2 lg:hidden">
              {jobs.map((job) => (
                <Link key={job.jobId} href={`/app/ingestions/${job.jobId}`} className="rounded-xl border border-white/10 bg-black/10 p-4 hover:border-lime/25">
                  <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm text-white">{job.originalFileName}</p><p className="mt-1 text-xs text-white/35">{job.exchange} · {formatDateTime(job.createdAt)}</p></div><StatusBadge status={job.status} /></div>
                  <dl className="mt-5 grid grid-cols-4 gap-2 text-center">
                    {[["Total", job.totalRows], ["Imported", job.importedRows], ["Rejected", job.failedRows], ["Duplicates", job.duplicateRows]].map(([label, value]) => <div key={label} className="rounded-lg bg-white/5 p-2"><dt className="text-[10px] text-white/32">{label}</dt><dd className="mt-1 font-mono text-sm text-white/70">{value}</dd></div>)}
                  </dl>
                </Link>
              ))}
            </div>
          </>
        )}
      </Card>
    </>
  );
}

