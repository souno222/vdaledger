import { SignIn } from "@clerk/nextjs";
import type { Metadata } from "next";
import Link from "next/link";

import { BrandMark } from "@/components/layout/brand-mark";
import { WebglBackdrop } from "@/components/marketing/webgl-backdrop";
import { GradientShell } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "Sign in" };

export default function SignInPage() {
  return (
    <main className="app-atmosphere app-grid relative isolate grid min-h-screen place-items-center px-4 py-10">
      <WebglBackdrop />
      <div className="w-full max-w-md">
        <BrandMark className="mb-7 justify-center" />
        <GradientShell innerClassName="p-2">
          <SignIn
            routing="path"
            path="/sign-in"
            signUpUrl="/sign-up"
            fallbackRedirectUrl="/app/dashboard"
          />
        </GradientShell>
        <p className="mt-6 text-center text-xs text-white/40">
          New to VDA Ledger?{" "}
          <Link className="text-lime hover:underline" href="/sign-up">
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}

