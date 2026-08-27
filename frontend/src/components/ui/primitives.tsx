import {
  CheckCircle2,
  Clock3,
  LoaderCircle,
  TriangleAlert,
  XCircle,
} from "lucide-react";
import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  SelectHTMLAttributes,
} from "react";

import type { IngestionStatus } from "@/lib/api/types";
import { ingestionStatusLabels } from "@/lib/status";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md";

export function buttonClassName({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) {
  return cn(
    "inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border font-medium transition duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-45",
    size === "md" ? "min-h-11 px-5 text-sm" : "min-h-9 px-3.5 text-xs",
    variant === "primary" &&
      "border-white bg-white text-primary-foreground hover:brightness-95",
    variant === "secondary" &&
      "border-white/20 bg-white/6 text-white hover:border-white/35 hover:brightness-110",
    variant === "ghost" &&
      "border-transparent bg-transparent text-white/70 hover:bg-white/8 hover:text-white",
    variant === "danger" &&
      "border-danger/35 bg-danger/10 text-red-100 hover:brightness-110",
    className,
  );
}

export function Button({
  className,
  variant,
  size,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  return (
    <button
      type={type}
      className={buttonClassName({
        ...(variant ? { variant } : {}),
        ...(size ? { size } : {}),
        ...(className ? { className } : {}),
      })}
      {...props}
    />
  );
}

export function Card({
  children,
  className,
  tone = "default",
}: {
  children: React.ReactNode;
  className?: string;
  tone?: "default" | "lime" | "quiet";
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border-[0.8px] p-4 backdrop-blur-xl",
        tone === "default" && "glass-panel",
        tone === "lime" && "border-primary/35 bg-primary/10",
        tone === "quiet" && "border-white/10 bg-black/10",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function GradientShell({
  children,
  className,
  innerClassName,
}: {
  children: React.ReactNode;
  className?: string;
  innerClassName?: string;
}) {
  return (
    <div className={cn("gradient-shell", className)}>
      <div
        className={cn(
          "h-full rounded-[27px] border-[0.8px] border-white/12 bg-secondary/88 backdrop-blur-xl",
          innerClassName,
        )}
      >
        {children}
      </div>
    </div>
  );
}

export function Badge({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex min-h-6 items-center gap-1.5 rounded-full border-[0.8px] border-white/15 bg-white/8 px-2.5 font-mono text-[11px] font-medium tracking-wide text-white/75",
        className,
      )}
    >
      {children}
    </span>
  );
}

const statusPresentation: Record<
  IngestionStatus,
  { className: string; icon: typeof Clock3 }
> = {
  PENDING: { className: "border-white/15 bg-white/8 text-white/75", icon: Clock3 },
  PROCESSING: {
    className: "border-info/30 bg-info/10 text-blue-100",
    icon: LoaderCircle,
  },
  COMPLETED: {
    className: "border-primary/35 bg-primary/10 text-primary",
    icon: CheckCircle2,
  },
  COMPLETED_WITH_ERRORS: {
    className: "border-warning/35 bg-warning/10 text-amber-100",
    icon: TriangleAlert,
  },
  FAILED: {
    className: "border-danger/35 bg-danger/10 text-red-100",
    icon: XCircle,
  },
};

export function StatusBadge({ status }: { status: IngestionStatus }) {
  const presentation = statusPresentation[status];
  const Icon = presentation.icon;

  return (
    <Badge className={presentation.className}>
      <Icon
        className={cn("size-3.5", status === "PROCESSING" && "animate-spin")}
        aria-hidden="true"
      />
      {ingestionStatusLabels[status]}
    </Badge>
  );
}

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "min-h-11 w-full rounded-lg border-[0.8px] border-white/15 bg-black/15 px-3.5 text-sm text-white outline-none placeholder:text-white/35 focus:border-primary/60 focus:ring-2 focus:ring-primary/20",
        className,
      )}
      {...props}
    />
  );
}

export function Select({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "min-h-11 w-full rounded-lg border-[0.8px] border-white/15 bg-secondary px-3.5 text-sm text-white outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="mb-5 flex flex-col gap-4 border-b-[0.8px] border-white/10 pb-5 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="type-label mb-2 font-mono uppercase tracking-[0.18em] text-primary">
          {eyebrow}
        </p>
        <h1 className="text-3xl tracking-[-0.045em] text-white sm:text-4xl">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-[22.75px] text-white/58">
          {description}
        </p>
      </div>
      {action}
    </header>
  );
}

export function StatCard({
  label,
  value,
  detail,
  icon: Icon,
  error,
}: {
  label: string;
  value: React.ReactNode;
  detail: string;
  icon: typeof Clock3;
  error?: boolean;
}) {
  return (
    <Card className={cn("min-h-36", error && "border-danger/30")}>
      <div className="flex items-start justify-between">
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-white/45">
          {label}
        </span>
        <Icon className="size-4 text-primary" aria-hidden="true" />
      </div>
      <div className="mt-5 text-3xl tracking-[-0.05em] text-white">{value}</div>
      <p className="mt-2 text-xs leading-5 text-white/45">{detail}</p>
    </Card>
  );
}

export function TableShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl border-[0.8px] border-white/10">
      <table className="w-full min-w-[760px] border-collapse text-left text-sm">
        {children}
      </table>
    </div>
  );
}

