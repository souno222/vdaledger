"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef } from "react";

import { buttonClassName } from "@/components/ui/primitives";

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

export function MobileDrawer({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const titleId = useId();
  const panelReference = useRef<HTMLDivElement>(null);
  const closeReference = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const previouslyFocused =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeReference.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !panelReference.current) return;

      const focusable = Array.from(
        panelReference.current.querySelectorAll<HTMLElement>(focusableSelector),
      ).filter((element) => element.offsetParent !== null);
      const first = focusable.at(0);
      const last = focusable.at(-1);
      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        type="button"
        tabIndex={-1}
        className="absolute inset-0 bg-black/68"
        aria-label={`Close ${title}`}
        onClick={onClose}
      />
      <div
        ref={panelReference}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative flex h-full w-[min(20rem,88vw)] flex-col border-r-[0.8px] border-white/12 bg-background p-4 shadow-2xl"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 id={titleId} className="text-sm font-medium text-white">
            {title}
          </h2>
          <button
            ref={closeReference}
            type="button"
            className={buttonClassName({
              variant: "secondary",
              size: "sm",
              className: "size-10 p-0",
            })}
            onClick={onClose}
            aria-label={`Close ${title}`}
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
        <div className="mt-6 min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
