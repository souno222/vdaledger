"use client";

import { CheckCircle2, ChevronLeft, CircleAlert } from "lucide-react";
import Link from "next/link";

import { EmptyState, ErrorState, Skeleton } from "@/components/feedback/states";
import { Badge, Card, PageHeader, StatusBadge, TableShell, buttonClassName } from "@/components/ui/primitives";
import { useIngestionDetail, useIngestionErrors } from "@/hooks/use-api";
import { isApiClientError } from "@/lib/api/api-error";
import { formatDateTime } from "@/lib/dates";
import { humanizeCode } from "@/lib/status";

export function DetailView({ jobId }: { jobId: string }) {
  const detailQuery = useIngestionDetail(jobId);
  const errorsQuery = useIngestionErrors(jobId, detailQuery.isSuccess);
  const notFound = isApiClientError(detailQuery.error) && detailQuery.error.status === 404;

  if (notFound) {
    return (
      <>
        <PageHeader eyebrow="Ingestion record" title="Job not found" description="This ingestion job does not exist or is not available to the current user." />
        <EmptyState icon={CircleAlert} title="Ingestion job not found" description="Return to your own ingestion history to choose an available job." action={<Link href="/app/ingestions" className={buttonClassName({ size: "sm" })}>Back to history</Link>} />
      </>
    );
  }

  return (
    <>
      <Link href="/app/ingestions" className="mb-5 inline-flex items-center gap-1.5 text-xs text-white/45 hover:text-white"><ChevronLeft className="size-3.5" aria-hidden="true" />Back to ingestion history</Link>
      <PageHeader
        eyebrow="Ingestion record"
        title={detailQuery.data?.originalFileName ?? "Ingestion details"}
        description="Backend lifecycle counters and persisted row-level rejection details."
        action={detailQuery.data ? <StatusBadge status={detailQuery.data.status} /> : undefined}
      />

      {detailQuery.isPending && <Skeleton className="h-44" />}
      {detailQuery.isError && !notFound && <ErrorState error={detailQuery.error} onRetry={() => void detailQuery.refetch()} />}
      {detailQuery.data && (
        <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Job summary">
            {[
              ["Exchange", detailQuery.data.exchange],
              ["Created", formatDateTime(detailQuery.data.createdAt)],
              ["Completed", formatDateTime(detailQuery.data.completedAt)],
              ["Total rows", String(detailQuery.data.totalRows)],
              ["Imported rows", String(detailQuery.data.importedRows)],
              ["Rejected rows", String(detailQuery.data.failedRows)],
              ["Duplicate rows", String(detailQuery.data.duplicateRows)],
              ["Job ID", detailQuery.data.jobId],
            ].map(([label, value]) => (
              <Card key={label} className="min-h-28">
                <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-white/35">{label}</p>
                <p className="mt-4 break-all text-sm leading-6 text-white/72">{value}</p>
              </Card>
            ))}
          </section>

          <Card className="mt-3">
            <div className="mb-5 flex items-center justify-between">
              <div><h2 className="text-lg text-white">Rejected and duplicate rows</h2><p className="mt-1 text-xs text-white/35">Raw row data is collapsed, escaped, and scrollable.</p></div>
              {errorsQuery.data && <Badge>{errorsQuery.data.length} records</Badge>}
            </div>
            {errorsQuery.isPending && <Skeleton className="h-72" />}
            {errorsQuery.isError && <ErrorState compact error={errorsQuery.error} onRetry={() => void errorsQuery.refetch()} />}
            {errorsQuery.data?.length === 0 && <EmptyState icon={CheckCircle2} title="No row errors were recorded" description="Every processed row completed without a persisted rejection or duplicate." />}
            {errorsQuery.data && errorsQuery.data.length > 0 && (
              <>
                <div className="hidden md:block">
                  <TableShell>
                    <thead className="data-table"><tr><th>Row</th><th>Error code</th><th>Message</th><th>Created</th><th>Raw row</th></tr></thead>
                    <tbody className="data-table">
                      {errorsQuery.data.map((error) => (
                        <tr key={error.id}>
                          <td>{error.rowNumber}</td>
                          <td><Badge className="border-warning/30 text-amber-100">{humanizeCode(error.errorCode)}</Badge></td>
                          <td className="max-w-md">{error.errorMessage}</td>
                          <td>{formatDateTime(error.createdAt)}</td>
                          <td>
                            <details>
                              <summary className="cursor-pointer text-xs text-lime focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime">View data</summary>
                              <pre className="mt-2 max-h-56 max-w-lg overflow-auto rounded-lg border border-white/10 bg-black/30 p-3 font-mono text-[11px] leading-5 text-white/60">{JSON.stringify(error.rawRow, null, 2)}</pre>
                            </details>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </TableShell>
                </div>
                <div className="grid gap-2 md:hidden">
                  {errorsQuery.data.map((error) => (
                    <article key={error.id} className="rounded-xl border border-white/10 bg-black/10 p-4">
                      <div className="flex items-start justify-between gap-3"><div><p className="text-sm text-white">Row {error.rowNumber}</p><p className="mt-1 text-xs leading-5 text-white/45">{error.errorMessage}</p></div><Badge className="border-warning/30 text-amber-100">{humanizeCode(error.errorCode)}</Badge></div>
                      <details className="mt-4"><summary className="cursor-pointer text-xs text-lime">View raw row</summary><pre className="mt-2 max-h-52 overflow-auto rounded-lg bg-black/30 p-3 font-mono text-[11px] leading-5 text-white/60">{JSON.stringify(error.rawRow, null, 2)}</pre></details>
                    </article>
                  ))}
                </div>
              </>
            )}
          </Card>
        </>
      )}
    </>
  );
}

