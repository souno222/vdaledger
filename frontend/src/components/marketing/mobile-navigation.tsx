"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { useCallback, useState } from "react";

import { MobileDrawer } from "@/components/layout/mobile-drawer";
import { buttonClassName } from "@/components/ui/primitives";

const links = [
  ["#capabilities", "Capabilities"],
  ["#record-trail", "Record trail"],
  ["#testimonials", "Social proof"],
  ["#tax-context", "Tax context"],
  ["/sign-in", "Sign in"],
  ["/sign-up", "Start your ledger"],
] as const;

export function MarketingMobileNavigation() {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        className={buttonClassName({
          variant: "secondary",
          size: "sm",
          className: "size-10 p-0",
        })}
        onClick={() => setOpen(true)}
        aria-label="Open site navigation"
        aria-expanded={open}
      >
        <Menu className="size-4" aria-hidden="true" />
      </button>
      <MobileDrawer open={open} onClose={close} title="Site navigation">
        <nav aria-label="Mobile site">
          <ul className="space-y-1">
            {links.map(([href, label]) => (
              <li key={href}>
                <Link
                  href={href}
                  onClick={close}
                  className="flex min-h-11 items-center rounded-xl border-[0.8px] border-transparent px-3 text-sm text-white/70 hover:border-white/10 hover:bg-white/7 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </MobileDrawer>
    </div>
  );
}
