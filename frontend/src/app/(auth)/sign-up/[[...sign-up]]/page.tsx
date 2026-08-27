import { SignUp } from "@clerk/nextjs";
import type { Metadata } from "next";
import Link from "next/link";

import { BrandMark } from "@/components/layout/brand-mark";
import { WebglBackdrop } from "@/components/marketing/webgl-backdrop";
import { GradientShell } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "Create account" };

export default function SignUpPage() {
  return (
    <main className="app-atmosphere app-grid relative isolate grid min-h-screen place-items-center px-4 py-10">
      <WebglBackdrop />
      <div className="w-full max-w-md">
        <BrandMark className="mb-7 justify-center" />
        <GradientShell innerClassName="p-2">
          <SignUp
            routing="path"
            path="/sign-up"
            signInUrl="/sign-in"
            fallbackRedirectUrl="/app/dashboard"
          />
        </GradientShell>
        <p className="mt-6 text-center text-xs text-white/40">
          Already have an account?{" "}
          <Link className="text-lime hover:underline" href="/sign-in">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}

