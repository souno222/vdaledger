import Link from "next/link";

import { cn } from "@/lib/utils";

export function BrandMark({
  compact = false,
  href = "/",
  className,
}: {
  compact?: boolean;
  href?: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime",
        className,
      )}
      aria-label="VDA Ledger home"
    >
      <svg
        viewBox="0 0 32 32"
        className="size-8 shrink-0"
        aria-hidden="true"
      >
        <rect width="32" height="32" rx="9" fill="#C8F542" />
        <path
          d="M8 9.5h10.5M8 15.8h16M8 22.2h10.5"
          stroke="#06130A"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="23.5" cy="9.5" r="2.5" fill="#06130A" />
        <circle cx="21.5" cy="22.2" r="2.5" fill="#06130A" />
      </svg>
      {!compact && (
        <span className="text-sm font-medium tracking-[-0.02em] text-white">
          VDA Ledger
        </span>
      )}
    </Link>
  );
}

