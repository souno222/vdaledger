"use client";

import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  Ban,
  Inbox,
  LogIn,
  RefreshCw,
  ServerOff,
  TimerReset,
  WifiOff,
} from "lucide-react";
import Link from "next/link";

import { Button, buttonClassName } from "@/components/ui/primitives";
import { isApiClientError } from "@/lib/api/api-error";
import { cn } from "@/lib/utils";

export function Skeleton({
  className,
  label = "Loading content",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <div role="status" aria-label={label}>
      <div
        className={cn("animate-pulse rounded-lg bg-white/[0.09]", className)}
        aria-hidden="true"
      />
    </div>
  );
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center rounded-xl border-[0.8px] border-dashed border-white/15 bg-black/10 px-6 py-10 text-center">
      <div className="mb-4 grid size-10 place-items-center rounded-full border-[0.8px] border-primary/25 bg-primary/10">
        <Icon className="size-4 text-primary" aria-hidden="true" />
      </div>
      <h2 className="text-lg text-white">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-[22.75px] text-white/50">
        {description}
      </p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

function errorPresentation(error: unknown) {
  if (!isApiClientError(error)) {
    return {
      icon: AlertTriangle,
      title: "This section could not be loaded",
      message: "An unexpected error interrupted this view.",
    };
  }

  if (error.status === 0) {
    return { icon: WifiOff, title: "The API is unreachable", message: error.message };
  }
  if (error.status === 401) {
    if (
      error.code === "INVALID_BEARER_TOKEN" ||
      error.code === "AUTHENTICATION_REQUIRED"
    ) {
      return {
        icon: AlertTriangle,
        title: "The backend rejected this session",
        message: error.message,
      };
    }
    return { icon: LogIn, title: "Sign in is required", message: error.message };
  }
  if (error.status === 403) {
    return { icon: Ban, title: "Access is not permitted", message: error.message };
  }
  if (error.status === 429) {
    return { icon: TimerReset, title: "Request limit reached", message: error.message };
  }
  if (error.status >= 500) {
    return { icon: ServerOff, title: "The backend could not complete this request", message: error.message };
  }
  return {
    icon: AlertTriangle,
    title: "This request could not be completed",
    message: error.message,
  };
}

export function ErrorState({
  error,
  onRetry,
  title,
  compact = false,
}: {
  error: unknown;
  onRetry?: () => void;
  title?: string;
  compact?: boolean;
}) {
  const presentation = errorPresentation(error);
  const Icon = presentation.icon;
  const authenticationRequired =
    isApiClientError(error) &&
    error.status === 401 &&
    error.code !== "INVALID_BEARER_TOKEN" &&
    error.code !== "AUTHENTICATION_REQUIRED";

  return (
    <div
      className={cn(
        "rounded-xl border-[0.8px] border-danger/30 bg-danger/8 p-5",
        compact && "p-4",
      )}
      role="alert"
    >
      <div className="flex gap-3">
        <Icon className="mt-0.5 size-4 shrink-0 text-red-100" aria-hidden="true" />
        <div>
          <h2 className="text-sm font-medium text-white">
            {title ?? presentation.title}
          </h2>
          <p className="mt-1 text-sm leading-[22.75px] text-white/58">
            {presentation.message}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {authenticationRequired && (
              <Link
                href="/sign-in"
                className={buttonClassName({ size: "sm" })}
              >
                <LogIn className="size-3.5" aria-hidden="true" />
                Sign in
              </Link>
            )}
            {onRetry && !authenticationRequired && (
              <Button size="sm" variant="secondary" onClick={onRetry}>
                <RefreshCw className="size-3.5" aria-hidden="true" />
                Try again
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
