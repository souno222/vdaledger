"use client";

import { useClerk, useUser, UserProfile } from "@clerk/nextjs";
import { LogOut, ShieldCheck, UserRound } from "lucide-react";

import { Skeleton } from "@/components/feedback/states";
import { Button, Card, PageHeader } from "@/components/ui/primitives";
import { formatDateTime } from "@/lib/dates";

export function ProfileView() {
  const { signOut } = useClerk();
  const { isLoaded, user } = useUser();
  const accountDetails = [
    ["Email", user?.primaryEmailAddress?.emailAddress ?? "Not available"],
    [
      "Member since",
      user?.createdAt
        ? formatDateTime(user.createdAt.toISOString())
        : "Not available",
    ],
  ];

  return (
    <>
      <PageHeader
        eyebrow="Account"
        title="Profile"
        description="Review your account email and Clerk-managed settings. VDA Ledger does not expose unsupported backend editing or account deletion."
        action={<Button variant="secondary" onClick={() => void signOut({ redirectUrl: "/" })}><LogOut className="size-4" aria-hidden="true" />Sign out</Button>}
      />

      <div className="grid gap-3 xl:grid-cols-[0.72fr_1.28fr]">
        <Card>
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-full border border-lime/25 bg-lime/10"><UserRound className="size-4 text-lime" aria-hidden="true" /></div>
            <div><h2 className="text-lg text-white">Account summary</h2><p className="text-xs text-white/35">Clerk-managed profile details</p></div>
          </div>
          {!isLoaded && <div className="mt-6 space-y-3"><Skeleton className="h-16" /><Skeleton className="h-16" /></div>}
          {isLoaded && (
            <dl className="mt-6 divide-y divide-white/8">
              {accountDetails.map(([term, detail]) => (
                <div key={term} className="py-4">
                  <dt className="text-xs text-white/35">{term}</dt>
                  <dd className="mt-1.5 break-all text-sm leading-5 text-white/68">{detail}</dd>
                </div>
              ))}
            </dl>
          )}
          <div className="mt-5 flex gap-3 rounded-xl border border-white/10 bg-black/10 p-4">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-lime" aria-hidden="true" />
            <p className="text-xs leading-5 text-white/42">The backend remains the authorization boundary. VDA Ledger never stores your Clerk session token manually.</p>
          </div>
        </Card>

        <section aria-labelledby="clerk-account-heading">
          <h2 id="clerk-account-heading" className="sr-only">Clerk account settings</h2>
          <UserProfile routing="hash" />
        </section>
      </div>
    </>
  );
}

