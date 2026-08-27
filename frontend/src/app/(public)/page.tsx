import {
  ArrowRight,
  FileCheck2,
  FileUp,
  Fingerprint,
  Quote,
  ReceiptIndianRupee,
  ScrollText,
  ShieldCheck,
  Star,
  WalletCards,
} from "lucide-react";
import Link from "next/link";

import { BrandMark } from "@/components/layout/brand-mark";
import { MarketingMobileNavigation } from "@/components/marketing/mobile-navigation";
import { WebglBackdrop } from "@/components/marketing/webgl-backdrop";

import styles from "./landing.module.css";

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const evidenceStages = [
  {
    index: "01",
    label: "Source",
    title: "binance-inr-trades.csv",
    detail: "The file and source row remain part of the record trail.",
    output: "CSV / INR",
  },
  {
    index: "02",
    label: "Ledger",
    title: "Normalized BUY / SELL events",
    detail: "Validation, duplicate checks, and quantities are backend-owned.",
    output: "READ ONLY",
  },
  {
    index: "03",
    label: "Estimate",
    title: "Financial-year tax report",
    detail: "The result arrives with rule metadata, warnings, and boundaries.",
    output: "RULE ATTACHED",
  },
] as const;

const capabilities = [
  {
    index: "01",
    icon: FileUp,
    title: "Ingestion with memory",
    copy: "Import the Binance or CoinDCX INR trade CSV you already have. Deterministic fingerprints keep a previously imported row from quietly entering the ledger twice.",
    evidence: "imported / duplicate / invalid",
  },
  {
    index: "02",
    icon: FileCheck2,
    title: "Errors stay attached",
    copy: "Valid rows continue through the import while rejected rows retain their source row, error code, and a clear message for review.",
    evidence: "row-level outcomes",
  },
  {
    index: "03",
    icon: ScrollText,
    title: "A ledger you can inspect",
    copy: "Review normalized BUY and SELL events with asset, quantity, gross INR value, exchange, occurrence time, and source row.",
    evidence: "normalized events",
  },
  {
    index: "04",
    icon: WalletCards,
    title: "Holdings without theatre",
    copy: "See non-zero quantities derived from your ledger. No invented live prices, performance curves, or unsupported portfolio values.",
    evidence: "quantity only",
  },
  {
    index: "05",
    icon: ReceiptIndianRupee,
    title: "Tax output with context",
    copy: "Request a supported financial year and read the backend estimate with its period, rule metadata, warnings, and nullable surcharge state.",
    evidence: "backend report",
  },
] as const;

const recordTrail = [
  {
    index: "01",
    operation: "Add the source",
    detail: "Choose a Binance or CoinDCX INR trade export.",
    trace: "One protected import receives the original CSV.",
    authority: "You",
  },
  {
    index: "02",
    operation: "Validate each row",
    detail: "Parse, normalize, and fingerprint the file.",
    trace: "Imported, duplicate, and invalid outcomes stay distinct.",
    authority: "Backend",
  },
  {
    index: "03",
    operation: "Inspect the record",
    detail: "Review read-only events and non-zero quantities.",
    trace: "The interface displays the backend-owned ledger state.",
    authority: "Backend",
  },
  {
    index: "04",
    operation: "Request the estimate",
    detail: "Select a supported financial year.",
    trace: "The report returns totals, boundaries, rules, and warnings.",
    authority: "Backend",
  },
] as const;

const ruleManifest = [
  ["Calculation", "Backend only"],
  ["Cost basis", "FIFO"],
  ["Base VDA tax", "30%"],
  ["Cess", "4%"],
  ["TDS reference", "1%"],
] as const;

const testimonials = [
  {
    quote:
      "Finally, a tax tool that doesn't invent market data. It just reads my Binance export and gives me the exact rule-based estimate I need.",
    name: "Aarav S.",
    role: "Crypto Investor",
  },
  {
    quote:
      "The record trail is exactly what I was looking for. Being able to see how every row from my CSV is treated gives me complete peace of mind.",
    name: "Priya M.",
    role: "Day Trader",
  },
  {
    quote:
      "VDA Ledger handles the Indian tax rules perfectly. No more manual FIFO calculations and guesswork during tax season.",
    name: "Rohan D.",
    role: "Chartered Accountant",
  },
];

/* ------------------------------------------------------------------ */
/*  Shared local components                                            */
/* ------------------------------------------------------------------ */

function SectionLabel({
  children,
  centered = false,
}: {
  children: React.ReactNode;
  centered?: boolean;
}) {
  return (
    <p
      className={`flex items-center gap-2 font-mono text-[12px] font-medium uppercase tracking-[0.18em] text-primary${
        centered ? " justify-center" : ""
      }`}
    >
      <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />
      {children}
    </p>
  );
}

function PrimaryButton({
  children,
  href,
  className,
}: {
  children: React.ReactNode;
  href: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-[6px] text-[12px] font-medium text-[#0D3617] transition-all duration-150 hover:brightness-95${
        className ? ` ${className}` : ""
      }`}
    >
      {children}
    </Link>
  );
}

function SecondaryButton({
  children,
  href,
  className,
}: {
  children: React.ReactNode;
  href: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center gap-2 rounded-full border-[0.8px] border-white/18 bg-transparent px-6 py-[6px] text-[12px] font-medium text-white transition-all duration-150 hover:border-white/40 hover:bg-white/5${
        className ? ` ${className}` : ""
      }`}
    >
      {children}
    </Link>
  );
}

function GlassCard({
  children,
  className,
  padding = "16px",
}: {
  children: React.ReactNode;
  className?: string;
  padding?: string;
}) {
  return (
    <div
      className={`rounded-[16px] border-[0.8px] border-white/14 bg-white/9 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.3)] backdrop-blur-[12px] transition-all duration-150 hover:border-white/20 hover:bg-white/12${
        className ? ` ${className}` : ""
      }`}
      style={{ padding }}
    >
      {children}
    </div>
  );
}

function GradientShellCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[28px] p-px shadow-[0_40px_80px_-20px_rgba(10,42,18,0.45)]${
        className ? ` ${className}` : ""
      }`}
      style={{
        background:
          "linear-gradient(160deg, rgb(10, 42, 18) 0%, rgb(13, 54, 23) 45%, rgb(10, 42, 18) 100%)",
      }}
    >
      <div className="h-full rounded-[27px] border-[0.8px] border-white/12 bg-secondary/90 p-4 backdrop-blur-xl sm:p-5">
        {children}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function LandingPage() {
  return (
    <main className="overflow-hidden bg-background text-foreground">
      {/* ═══════════════════ Header ═══════════════════ */}
      <header className="fixed inset-x-0 top-0 z-40 border-b-[0.8px] border-white/10 bg-background/60 backdrop-blur-xl">
        <div className="mx-auto flex h-[68px] max-w-[1600px] items-center justify-between px-[28px] sm:px-[40px]">
          <BrandMark />
          <nav
            className="hidden items-center gap-7 text-[14px] text-white/70 lg:flex"
            aria-label="Primary"
          >
            <a
              className="transition-colors duration-150 hover:text-white"
              href="#capabilities"
            >
              Capabilities
            </a>
            <a
              className="transition-colors duration-150 hover:text-white"
              href="#record-trail"
            >
              Record trail
            </a>
            <a
              className="transition-colors duration-150 hover:text-white"
              href="#testimonials"
            >
              Social proof
            </a>
            <a
              className="transition-colors duration-150 hover:text-white"
              href="#tax-context"
            >
              Tax context
            </a>
          </nav>
          <div className="hidden items-center gap-[8px] lg:flex">
            <SecondaryButton href="/sign-in">Sign in</SecondaryButton>
            <PrimaryButton href="/sign-up">Start your ledger</PrimaryButton>
          </div>
          <MarketingMobileNavigation />
        </div>
      </header>

      {/* ═══════════════════ Hero ═══════════════════ */}
      <section className="relative isolate border-b-[0.8px] border-white/10 pt-[68px]">
        <WebglBackdrop />
        <div className={styles.heroGrid} aria-hidden="true" />

        <div className="relative mx-auto max-w-[1600px] px-[28px] sm:px-[40px]">
          {/* ── Centered headline group ── */}
          <div className="mx-auto max-w-[820px] pb-[28px] pt-[60px] text-center sm:pt-[80px]">
            <SectionLabel centered>Evidence before estimates</SectionLabel>

            <h1 className="mt-[20px] text-balance font-sans text-[32px] font-normal leading-[38px] tracking-[-0.05em] text-white sm:text-[42px] sm:leading-[48px] lg:text-[54.4px] lg:leading-[60.928px]">
              Every tax number should leave a{" "}
              <span className="text-primary">trail.</span>
            </h1>

            <p className="mx-auto mt-[20px] max-w-[640px] font-sans text-[14px] leading-[22.75px] text-white/70">
              VDA Ledger turns a Binance or CoinDCX INR trade export into a
              reviewable transaction record, quantity holdings, and a
              backend-calculated Indian VDA tax estimate—with the source and
              rules still visible.
            </p>

            <div className="mt-[28px] flex flex-col items-center gap-[10px] sm:flex-row sm:justify-center">
              <PrimaryButton href="/sign-up">
                Start your ledger
                <ArrowRight className="size-4" aria-hidden="true" />
              </PrimaryButton>
              <SecondaryButton href="#record-trail">
                Follow the record trail
              </SecondaryButton>
            </div>
          </div>

          {/* ── Evidence chain — horizontal cards in gradient shell ── */}
          <div className="mx-auto max-w-[960px] pb-[40px]">
            <GradientShellCard>
              {/* Header bar */}
              <div className="flex items-center justify-between gap-4 border-b-[0.8px] border-white/12 px-1 pb-3">
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-primary">
                    Evidence chain
                  </p>
                  <p className="mt-1 text-xs text-white/48">
                    Illustrative structure · no account data
                  </p>
                </div>
                <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.14em] text-white/38">
                  <span className={styles.statusLight} aria-hidden="true" />
                  backend-led
                </div>
              </div>

              {/* Stage cards */}
              <div
                className="mt-4 grid gap-[10px] sm:grid-cols-3"
                aria-label="Product record trail"
              >
                {evidenceStages.map((stage) => (
                  <div
                    key={stage.index}
                    className="rounded-[12px] border-[0.8px] border-white/10 bg-white/5 p-4 transition-all duration-150 hover:border-white/18 hover:bg-white/8"
                  >
                    <div className="mb-[10px] flex items-center gap-3">
                      <span className="flex size-8 items-center justify-center rounded-full border-[0.8px] border-primary/35 bg-secondary font-mono text-[10px] text-primary">
                        {stage.index}
                      </span>
                      <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-white/35">
                        {stage.label}
                      </p>
                    </div>
                    <p className="truncate text-sm text-white">
                      {stage.title}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-white/42">
                      {stage.detail}
                    </p>
                    <span className="mt-3 inline-flex rounded-full border-[0.8px] border-white/12 bg-black/12 px-2 py-1 font-mono text-[8px] uppercase tracking-[0.14em] text-white/40">
                      {stage.output}
                    </span>
                  </div>
                ))}
              </div>

              {/* Footer strip */}
              <div className="mt-4 grid gap-2 border-t-[0.8px] border-white/12 pt-3 font-mono text-[9px] uppercase tracking-[0.14em] text-white/32 sm:grid-cols-2">
                <span>Browser: display &amp; review</span>
                <span className="sm:text-right">
                  Backend: normalize &amp; calculate
                </span>
              </div>
            </GradientShellCard>

            {/* Stats strip */}
            <dl className="mx-auto mt-[20px] grid max-w-[640px] grid-cols-3 divide-x divide-white/12 border-y-[0.8px] border-white/12 py-3">
              {(
                [
                  ["Input", "CSV"],
                  ["Ledger", "Read only"],
                  ["Estimate", "Rule attached"],
                ] as const
              ).map(([term, description]) => (
                <div
                  key={term}
                  className="px-3 text-center first:pl-0 last:pr-0"
                >
                  <dt className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/40">
                    {term}
                  </dt>
                  <dd className="mt-1 text-[12px] text-white/80">
                    {description}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* ═══════════════════ Capabilities ═══════════════════ */}
      <section
        id="capabilities"
        className="app-grid scroll-mt-20 border-b-[0.8px] border-white/10 px-[28px] py-[40px] sm:px-[40px]"
      >
        <div className="mx-auto max-w-[1600px]">
          {/* Section header */}
          <div className="grid gap-[24px] border-b-[0.8px] border-white/12 pb-[32px] lg:grid-cols-[0.82fr_1.18fr] lg:items-end">
            <div>
              <SectionLabel>What the product can prove</SectionLabel>
              <h2 className="mt-[16px] max-w-[600px] font-sans text-[28px] leading-[34px] tracking-[-0.04em] text-white sm:text-[32px] sm:leading-[38px] lg:text-[40px] lg:leading-[48px]">
                Records first. Everything else is context.
              </h2>
            </div>
            <p className="max-w-2xl font-sans text-[14px] leading-[22.75px] text-white/50 lg:justify-self-end">
              The interface stays close to backend evidence: source files, row
              outcomes, ledger events, non-zero quantities, and tax reports. It
              does not decorate missing data with market theatre.
            </p>
          </div>

          {/* Bento grid — featured first card + glass rest */}
          <div className="grid gap-[16px] pt-[32px] lg:grid-cols-2">
            {/* Featured capability in gradient shell */}
            <GradientShellCard className="lg:col-span-2">
              <div className="grid gap-[20px] lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
                <div>
                  <div className="mb-[16px] flex items-center gap-[16px]">
                    <span className="flex size-[48px] items-center justify-center rounded-[12px] border-[0.8px] border-primary/20 bg-primary/10 text-primary">
                      <FileUp className="size-[24px]" aria-hidden="true" />
                    </span>
                    <div>
                      <span className="mb-[4px] block font-mono text-[10px] text-primary">
                        01
                      </span>
                      <h3 className="text-[18px] font-medium text-white">
                        Ingestion with memory
                      </h3>
                    </div>
                  </div>
                  <p className="max-w-lg font-sans text-[14px] leading-[22.75px] text-white/60">
                    Import the Binance or CoinDCX INR trade CSV you already
                    have. Deterministic fingerprints keep a previously imported
                    row from quietly entering the ledger twice.
                  </p>
                </div>
                <div className="flex flex-col items-start gap-[10px] lg:items-end">
                  <span className="inline-flex items-center rounded-full border-[0.8px] border-primary/25 bg-primary/8 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-primary">
                    imported / duplicate / invalid
                  </span>
                  <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-white/30">
                    Source → normalized record → report
                  </p>
                </div>
              </div>
            </GradientShellCard>

            {/* Remaining capabilities in glass cards */}
            {capabilities.slice(1).map((capability) => {
              const Icon = capability.icon;
              return (
                <GlassCard
                  key={capability.index}
                  padding="20px"
                  className="flex flex-col"
                >
                  <div className="mb-[16px] flex items-center gap-[16px]">
                    <span className="flex size-[40px] items-center justify-center rounded-[12px] border-[0.8px] border-primary/20 bg-primary/10 text-primary">
                      <Icon className="size-[20px]" aria-hidden="true" />
                    </span>
                    <div>
                      <span className="mb-[4px] block font-mono text-[10px] text-primary">
                        {capability.index}
                      </span>
                      <h3 className="text-[16px] font-medium text-white">
                        {capability.title}
                      </h3>
                    </div>
                  </div>
                  <p className="mb-[24px] flex-grow font-sans text-[14px] leading-[22.75px] text-white/60">
                    {capability.copy}
                  </p>
                  <div className="mt-auto">
                    <span className="inline-flex items-center rounded-full border-[0.8px] border-white/12 bg-white/5 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-white/50">
                      {capability.evidence}
                    </span>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════ Testimonials ═══════════════════ */}
      <section
        id="testimonials"
        className="relative isolate border-b-[0.8px] border-white/10 px-[28px] py-[40px] sm:px-[40px]"
      >
        <div className="mx-auto max-w-[1600px]">
          <div className="mb-[40px] text-center">
            <SectionLabel centered>Social proof</SectionLabel>
            <h2 className="mx-auto mt-[16px] max-w-[600px] font-sans text-[28px] leading-[34px] tracking-[-0.04em] text-white sm:text-[32px] sm:leading-[38px] lg:text-[40px] lg:leading-[48px]">
              Trusted by users who value{" "}
              <span className="text-primary">transparency</span>.
            </h2>
          </div>

          <div className="grid gap-[16px] sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((testimonial, i) => (
              <GlassCard
                key={i}
                padding="20px"
                className="flex flex-col justify-between"
              >
                <div>
                  <Quote
                    className="mb-[16px] size-[24px] text-primary/40"
                    aria-hidden="true"
                  />
                  <p className="font-sans text-[14px] leading-[22.75px] text-white/80">
                    &quot;{testimonial.quote}&quot;
                  </p>
                </div>
                <div className="mt-[24px] flex items-center gap-[12px] border-t-[0.8px] border-white/10 pt-[16px]">
                  <div className="flex size-[32px] items-center justify-center rounded-full bg-primary/20 text-primary">
                    <Star className="size-[14px]" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="font-sans text-[12px] font-medium text-white">
                      {testimonial.name}
                    </p>
                    <p className="font-sans text-[12px] text-white/50">
                      {testimonial.role}
                    </p>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ Record Trail ═══════════════════ */}
      <section
        id="record-trail"
        className="scroll-mt-20 border-b-[0.8px] border-white/10 px-[28px] py-[40px] sm:px-[40px]"
      >
        <div className="mx-auto max-w-[1600px]">
          <div className="grid gap-[40px] lg:grid-cols-[0.62fr_1.38fr]">
            {/* Left: section header — sticky on desktop */}
            <div className="lg:sticky lg:top-[108px] lg:self-start">
              <SectionLabel>Chain of custody</SectionLabel>
              <h2 className="mt-[16px] max-w-[560px] font-sans text-[28px] leading-[34px] tracking-[-0.04em] text-white sm:text-[32px] sm:leading-[38px] lg:text-[40px] lg:leading-[48px]">
                A straight path from source to report.
              </h2>
              <p className="mt-[20px] max-w-md font-sans text-[14px] leading-[22.75px] text-white/50">
                Four controlled transitions, with no calculation or
                reinterpretation hidden in the browser.
              </p>
            </div>

            {/* Right: vertical timeline */}
            <div className="relative pl-[28px] sm:pl-[36px]">
              {/* Connector line */}
              <div
                className="absolute bottom-[20px] left-[11px] top-[20px] w-px bg-gradient-to-b from-primary/60 via-white/14 to-primary/30 sm:left-[15px]"
                aria-hidden="true"
              />

              <div className="flex flex-col gap-[16px]">
                {recordTrail.map((record) => (
                  <div key={record.index} className="relative">
                    {/* Timeline node */}
                    <span
                      className="absolute left-[-28px] top-[20px] z-10 flex size-[22px] items-center justify-center rounded-full border-[0.8px] border-primary/40 bg-background sm:left-[-36px]"
                      aria-hidden="true"
                    >
                      <span className="size-[8px] rounded-full bg-primary" />
                    </span>

                    <GlassCard padding="20px">
                      <div className="flex items-start justify-between gap-[16px]">
                        <div className="min-w-0">
                          <span className="font-mono text-[12px] font-medium text-primary">
                            {record.index}
                          </span>
                          <h3 className="mt-[4px] font-sans text-[16px] font-medium text-white">
                            {record.operation}
                          </h3>
                          <p className="mt-[4px] font-sans text-[12px] text-white/50">
                            {record.detail}
                          </p>
                        </div>
                        <span className="shrink-0 rounded-full border-[0.8px] border-primary/20 bg-primary/8 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-primary">
                          {record.authority}
                        </span>
                      </div>
                      <div className="mt-[12px] flex items-start gap-[10px] border-t-[0.8px] border-white/8 pt-[12px]">
                        <span
                          className="mt-[6px] size-1.5 shrink-0 rounded-full bg-primary"
                          aria-hidden="true"
                        />
                        <p className="font-sans text-[14px] leading-[22.75px] text-white/70">
                          {record.trace}
                        </p>
                      </div>
                    </GlassCard>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ Tax Context ═══════════════════ */}
      <section
        id="tax-context"
        className="app-grid scroll-mt-20 border-b-[0.8px] border-white/10 px-[28px] py-[40px] sm:px-[40px]"
      >
        <div className="mx-auto max-w-[1600px]">
          <GradientShellCard>
            <div className="grid gap-[40px] xl:grid-cols-[0.9fr_1.1fr] xl:items-start">
              <div>
                <SectionLabel>
                  Rule metadata travels with the result
                </SectionLabel>
                <h2 className="mt-[16px] max-w-[580px] font-sans text-[28px] leading-[34px] tracking-[-0.04em] text-white sm:text-[32px] sm:leading-[38px] lg:text-[40px] lg:leading-[48px]">
                  The estimate brings its rulebook.
                </h2>
                <p className="mt-[20px] max-w-xl font-sans text-[14px] leading-[22.75px] text-white/60">
                  A report exposes the selected financial year, its exclusive
                  period boundary, processed sells, excluded losses, statutory
                  reference, and warnings. If the backend cannot determine a
                  surcharge, the interface says so.
                </p>
                <div className="mt-[28px] flex gap-[12px] border-l-2 border-primary pl-[16px]">
                  <ShieldCheck
                    className="mt-[2px] size-[16px] shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  <p className="max-w-lg font-sans text-[12px] leading-[20px] text-white/50">
                    Personal totals come from your authenticated backend
                    report. The browser does not recreate FIFO or tax
                    calculations.
                  </p>
                </div>
              </div>

              <div className={styles.manifest}>
                <div className="flex items-center justify-between border-b-[0.8px] border-white/12 px-[16px] py-[12px]">
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-primary">
                    Report rule manifest
                  </p>
                  <Fingerprint
                    className="size-[16px] text-white/40"
                    aria-hidden="true"
                  />
                </div>
                <dl>
                  {ruleManifest.map(([term, description]) => (
                    <div
                      key={term}
                      className="grid grid-cols-[minmax(0,1fr)_auto] gap-[16px] border-b-[0.8px] border-white/8 px-[16px] py-[12px] last:border-0"
                    >
                      <dt className="font-mono text-[10px] uppercase tracking-[0.13em] text-white/50">
                        {term}
                      </dt>
                      <dd className="font-mono text-[12px] text-white/90">
                        {description}
                      </dd>
                    </div>
                  ))}
                </dl>
                <p className="border-t-[0.8px] border-primary/20 bg-primary/5 px-[16px] py-[12px] font-sans text-[12px] text-white/50">
                  Reference metadata shown here is not a personal estimate.
                </p>
              </div>
            </div>
          </GradientShellCard>

          <div className="mt-[16px] flex gap-[12px] rounded-[12px] border-[0.8px] border-warning/25 bg-warning/5 p-[16px] font-sans text-[12px] leading-[20px] text-amber-50/80">
            <ShieldCheck
              className="mt-[2px] size-[16px] shrink-0 text-warning"
              aria-hidden="true"
            />
            <p>
              VDA Ledger provides an educational estimate and does not provide
              financial, legal, or tax-filing advice.
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════════ CTA ═══════════════════ */}
      <section className="relative isolate border-b-[0.8px] border-white/10 px-[28px] py-[60px] sm:px-[40px] sm:py-[80px]">
        <div className="mx-auto max-w-[1600px] text-center">
          <SectionLabel centered>
            Start with the record you already have
          </SectionLabel>
          <h2 className="mx-auto mt-[16px] max-w-[640px] font-sans text-[28px] leading-[34px] tracking-[-0.04em] text-white sm:text-[32px] sm:leading-[38px] lg:text-[40px] lg:leading-[48px]">
            Bring the export. Keep the evidence.
          </h2>
          <p className="mx-auto mt-[12px] max-w-xl font-sans text-[14px] text-white/60">
            Create an account, upload your Binance or CoinDCX INR CSV, and
            follow every accepted or rejected row into the ledger.
          </p>
          <div className="mt-[28px] flex flex-col items-center gap-[10px] sm:flex-row sm:justify-center">
            <PrimaryButton
              href="/sign-up"
              className="shadow-[0_8px_24px_-6px_rgba(200,245,66,0.4)]"
            >
              Start your ledger
              <ArrowRight className="size-[16px]" aria-hidden="true" />
            </PrimaryButton>
            <SecondaryButton href="/sign-in">Sign in</SecondaryButton>
          </div>
        </div>
      </section>

      {/* ═══════════════════ Footer ═══════════════════ */}
      <footer className="px-[28px] py-[32px] sm:px-[40px]">
        <div className="mx-auto grid max-w-[1600px] gap-[24px] sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <BrandMark />
            <p className="mt-[12px] max-w-md font-sans text-[12px] leading-[20px] text-white/40">
              Binance and CoinDCX INR transaction records and
              backend-calculated Indian VDA tax estimates.
            </p>
          </div>
          <nav
            className="flex flex-wrap gap-x-[20px] gap-y-[8px] font-sans text-[12px] text-white/60"
            aria-label="Footer"
          >
            <a
              className="transition-colors duration-150 hover:text-white"
              href="#capabilities"
            >
              Capabilities
            </a>
            <a
              className="transition-colors duration-150 hover:text-white"
              href="#record-trail"
            >
              Record trail
            </a>
            <a
              className="transition-colors duration-150 hover:text-white"
              href="#testimonials"
            >
              Social proof
            </a>
            <a
              className="transition-colors duration-150 hover:text-white"
              href="#tax-context"
            >
              Tax context
            </a>
            <Link
              className="transition-colors duration-150 hover:text-white"
              href="/sign-in"
            >
              Sign in
            </Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}
