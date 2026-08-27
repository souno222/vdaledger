"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import {
  FileClock,
  FileUp,
  LayoutDashboard,
  Menu,
  ReceiptIndianRupee,
  ScrollText,
  UserRound,
  WalletCards,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useState } from "react";

import { BrandMark } from "@/components/layout/brand-mark";
import { MobileDrawer } from "@/components/layout/mobile-drawer";
import { buttonClassName } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

const navigation = [
  { href: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/app/upload", label: "Upload CSV", icon: FileUp },
  { href: "/app/ingestions", label: "Ingestions", icon: FileClock },
  { href: "/app/ledger", label: "Ledger", icon: ScrollText },
  { href: "/app/portfolio", label: "Holdings", icon: WalletCards },
  { href: "/app/tax", label: "Tax estimate", icon: ReceiptIndianRupee },
  { href: "/app/profile", label: "Profile", icon: UserRound },
] as const;

function NavigationLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Application">
      <ul className="space-y-1">
        {navigation.map((item) => {
          const active =
            pathname === item.href ||
            (item.href === "/app/ingestions" &&
              pathname.startsWith("/app/ingestions/"));
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                {...(onNavigate ? { onClick: onNavigate } : {})}
                {...(active ? { "aria-current": "page" as const } : {})}
                className={cn(
                  "flex min-h-11 items-center gap-3 rounded-xl border-[0.8px] px-3 text-sm transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  active
                    ? "border-primary/25 bg-primary/12 text-white"
                    : "border-transparent text-white/55 hover:bg-white/6 hover:text-white",
                )}
              >
                <Icon
                  className={cn("size-4", active && "text-primary")}
                  aria-hidden="true"
                />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isLoaded, user } = useUser();
  const closeMobile = useCallback(() => setMobileOpen(false), []);

  return (
    <div className="app-atmosphere app-grid min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r-[0.8px] border-white/10 bg-background/92 p-4 backdrop-blur-xl lg:flex">
        <BrandMark href="/app/dashboard" className="px-2 py-2" />
        <div className="mt-8 flex-1">
          <p className="mb-3 px-3 font-mono text-[10px] uppercase tracking-[0.16em] text-white/35">
            Workspace
          </p>
          <NavigationLinks />
        </div>
        <div className="rounded-xl border-[0.8px] border-white/10 bg-white/5 p-3">
          <p className="text-xs text-white/42">Signed in as</p>
          <div className="mt-2 flex min-h-8 items-center gap-3">
            <UserButton />
            <p className="min-w-0 truncate text-sm text-white/78">
              {isLoaded
                ? user?.primaryEmailAddress?.emailAddress ?? "Authenticated user"
                : "Loading account…"}
            </p>
          </div>
        </div>
      </aside>

      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b-[0.8px] border-white/10 bg-background/88 px-4 backdrop-blur-xl lg:ml-64 lg:px-7">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className={buttonClassName({
              variant: "secondary",
              size: "sm",
              className: "size-10 p-0 lg:hidden",
            })}
            onClick={() => setMobileOpen(true)}
            aria-label="Open application navigation"
            aria-expanded={mobileOpen}
          >
            <Menu className="size-4" aria-hidden="true" />
          </button>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-primary">
              VDA / INR
            </p>
            <p className="text-xs text-white/42">Secure ledger workspace</p>
          </div>
        </div>
        <div className="lg:hidden">
          <UserButton />
        </div>
      </header>

      <MobileDrawer
        open={mobileOpen}
        onClose={closeMobile}
        title="Application navigation"
      >
        <BrandMark href="/app/dashboard" className="mb-6" />
        <NavigationLinks onNavigate={closeMobile} />
      </MobileDrawer>

      <main className="px-4 py-6 sm:px-6 lg:ml-64 lg:px-7 lg:py-7">
        <div className="w-full">{children}</div>
      </main>
    </div>
  );
}
