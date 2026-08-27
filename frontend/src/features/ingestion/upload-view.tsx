"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  FileText,
  FileUp,
  RotateCcw,
  TriangleAlert,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { ErrorState } from "@/components/feedback/states";
import {
  Button,
  Card,
  GradientShell,
  PageHeader,
  Select,
  StatusBadge,
  buttonClassName,
} from "@/components/ui/primitives";
import { useUploadIngestion } from "@/hooks/use-api";
import { queryKeys } from "@/lib/api/query-keys";
import type { ExchangeType } from "@/lib/api/types";
import { formatInteger } from "@/lib/numbers";
import { cn } from "@/lib/utils";

const maxFileSize = 20 * 1024 * 1024;

export const uploadSchema = z.object({
  exchange: z.enum(["BINANCE", "COINDCX"]),
  file: z
    .custom<File>(
      (value) => typeof File !== "undefined" && value instanceof File,
      "Choose a CSV file.",
    )
    .refine((file) => file.name.toLowerCase().endsWith(".csv"), {
      message: "Only .csv files are supported.",
    })
    .refine((file) => file.size <= maxFileSize, {
      message: "The CSV must be 20 MB or smaller.",
    }),
});

type UploadFormValues = z.infer<typeof uploadSchema>;

const exchangeDetails: Record<
  ExchangeType,
  { label: string; headers: string }
> = {
  BINANCE: {
    label: "Binance",
    headers: "Date(UTC), Pair, Side, Price, Executed, Amount, Fee",
  },
  COINDCX: {
    label: "CoinDCX",
    headers:
      "Trade ID, Crypto Pair (or Crypto), Trade Completion Time, Side, average price, quantity, gross amount",
  },
};

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function UploadView() {
  const fileInput = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const queryClient = useQueryClient();
  const uploadMutation = useUploadIngestion();
  const {
    control,
    handleSubmit,
    register,
    setValue,
    resetField,
    formState: { errors },
  } = useForm<UploadFormValues>({
    resolver: zodResolver(uploadSchema),
    defaultValues: { exchange: "BINANCE" },
  });
  const selectedFile = useWatch({ control, name: "file" });
  const selectedExchange = useWatch({ control, name: "exchange" });

  const selectFile = (file: File | undefined) => {
    if (!file) return;
    setValue("file", file, { shouldDirty: true, shouldValidate: true });
    uploadMutation.reset();
  };

  const clearFile = () => {
    resetField("file");
    if (fileInput.current) fileInput.current.value = "";
    uploadMutation.reset();
  };

  const submit = handleSubmit(async ({ exchange, file }) => {
    try {
      const result = await uploadMutation.mutateAsync({ exchange, file });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.ingestions.root }),
        queryClient.invalidateQueries({ queryKey: queryKeys.ledger.root }),
        queryClient.invalidateQueries({ queryKey: queryKeys.portfolio.root }),
        queryClient.invalidateQueries({ queryKey: queryKeys.tax.root }),
      ]);
      toast.success("CSV ingestion completed", { description: result.message });
    } catch {
      toast.error("CSV upload failed", {
        description: "Review the error on this page and try again.",
      });
    }
  });

  return (
    <>
      <PageHeader
        eyebrow="Exchange import"
        title="Upload transaction CSV"
        description="Upload a Binance or CoinDCX INR BUY/SELL trade export. The browser validates only file presence, extension, and size; the backend validates every transaction."
      />

      <div className="grid gap-3 xl:grid-cols-[1.12fr_0.88fr]">
        <GradientShell innerClassName="p-5 sm:p-6">
          <form onSubmit={submit} noValidate aria-busy={uploadMutation.isPending}>
            <div>
              <label htmlFor="exchange" className="mb-2 block text-sm text-white/72">Exchange</label>
              <div className="relative">
                <Select
                  id="exchange"
                  {...register("exchange", {
                    onChange: () => uploadMutation.reset(),
                  })}
                  className="pr-24"
                >
                  <option value="BINANCE">Binance</option>
                  <option value="COINDCX">CoinDCX</option>
                </Select>
                <span className="pointer-events-none absolute right-9 top-1/2 -translate-y-1/2 font-mono text-[10px] uppercase tracking-[0.12em] text-lime">INR only</span>
              </div>
            </div>

            <div className="mt-5">
              <label className="mb-2 block text-sm text-white/72" htmlFor="csv-file">CSV file</label>
              <div
                className={cn(
                  "relative flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-10 text-center transition",
                  dragging
                    ? "border-lime bg-lime/10"
                    : "border-white/18 bg-black/10 hover:border-lime/45",
                )}
                onDragEnter={(event) => {
                  event.preventDefault();
                  setDragging(true);
                }}
                onDragOver={(event) => event.preventDefault()}
                onDragLeave={(event) => {
                  event.preventDefault();
                  setDragging(false);
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  setDragging(false);
                  selectFile(event.dataTransfer.files[0]);
                }}
              >
                <input
                  ref={fileInput}
                  id="csv-file"
                  type="file"
                  accept=".csv,text/csv"
                  className="sr-only"
                  onChange={(event) => selectFile(event.target.files?.[0])}
                  aria-describedby={errors.file ? "file-error file-help" : "file-help"}
                />
                {selectedFile ? (
                  <>
                    <div className="grid size-12 place-items-center rounded-full border border-lime/30 bg-lime/10">
                      <FileText className="size-5 text-lime" aria-hidden="true" />
                    </div>
                    <p className="mt-4 max-w-full truncate text-sm text-white">{selectedFile.name}</p>
                    <p className="mt-1 font-mono text-xs text-white/38">{formatFileSize(selectedFile.size)}</p>
                    <Button size="sm" variant="ghost" className="mt-4" onClick={clearFile}>
                      <X className="size-3.5" aria-hidden="true" />
                      Clear selected file
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="grid size-12 place-items-center rounded-full border border-lime/25 bg-lime/8">
                      <FileUp className="size-5 text-lime" aria-hidden="true" />
                    </div>
                    <p className="mt-4 text-sm text-white">Drop a CSV here</p>
                    <p className="mt-1 text-xs text-white/38">or choose one from your computer</p>
                    <Button size="sm" variant="secondary" className="mt-4" onClick={() => fileInput.current?.click()}>
                      Browse files
                    </Button>
                  </>
                )}
              </div>
              <p id="file-help" className="mt-2 text-xs leading-5 text-white/35">
                Maximum 20 MB. Expected {exchangeDetails[selectedExchange].label} fields: {exchangeDetails[selectedExchange].headers}.
              </p>
              {errors.file && <p id="file-error" className="mt-2 text-sm text-red-200" role="alert">{errors.file.message}</p>}
            </div>

            <Button className="mt-6 w-full sm:w-auto" type="submit" disabled={uploadMutation.isPending}>
              {uploadMutation.isPending ? <RotateCcw className="size-4 animate-spin" aria-hidden="true" /> : <FileUp className="size-4" aria-hidden="true" />}
              {uploadMutation.isPending ? "Uploading…" : "Upload CSV"}
            </Button>
          </form>
        </GradientShell>

        <div className="space-y-3">
          <Card tone="quiet">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-lime">Supported contract</p>
            <dl className="mt-5 divide-y divide-white/8 text-sm">
              {[["Exchange", exchangeDetails[selectedExchange].label], ["Quote asset", "INR"], ["Transaction types", "BUY and SELL"], ["Processing", "Synchronous backend ingestion"]].map(([term, detail]) => (
                <div key={term} className="flex justify-between gap-4 py-3">
                  <dt className="text-white/35">{term}</dt><dd className="font-mono text-xs text-white/70">{detail}</dd>
                </div>
              ))}
            </dl>
          </Card>

          <div aria-live="polite">
            {uploadMutation.isError && <ErrorState error={uploadMutation.error} title="The CSV could not be uploaded" />}
            {uploadMutation.data && (
              <Card className={uploadMutation.data.status === "COMPLETED" ? "border-lime/30" : "border-warning/30"}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/35">Upload result</p>
                    <p className="mt-2 text-sm leading-6 text-white/70">{uploadMutation.data.message}</p>
                  </div>
                  <StatusBadge status={uploadMutation.data.status} />
                </div>
                <div className="mt-5 grid grid-cols-2 gap-2">
                  {([
                    ["Total", uploadMutation.data.totalRows],
                    ["Imported", uploadMutation.data.importedRows],
                    ["Rejected", uploadMutation.data.failedRows],
                    ["Duplicates", uploadMutation.data.duplicateRows],
                  ] as const).map(([label, value]) => (
                    <div key={label} className="rounded-xl border border-white/8 bg-black/10 p-3">
                      <p className="text-xs text-white/35">{label}</p>
                      <p className="mt-1 font-mono text-lg text-white">{formatInteger(value)}</p>
                    </div>
                  ))}
                </div>
                <Link href={`/app/ingestions/${uploadMutation.data.jobId}`} className={buttonClassName({ variant: "secondary", size: "sm", className: "mt-5" })}>
                  {uploadMutation.data.status === "COMPLETED_WITH_ERRORS" ? <TriangleAlert className="size-3.5" aria-hidden="true" /> : <CheckCircle2 className="size-3.5" aria-hidden="true" />}
                  {uploadMutation.data.status === "COMPLETED_WITH_ERRORS" ? "Review errors" : "View ingestion details"}
                </Link>
              </Card>
            )}
          </div>
        </div>
      </div>
    </>
  );
}



