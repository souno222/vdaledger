import Link from "next/link";

import { BrandMark } from "@/components/layout/brand-mark";
import { buttonClassName } from "@/components/ui/primitives";

export default function NotFound() {
  return (
    <main className="app-grid grid min-h-screen place-items-center px-4">
      <div className="max-w-lg text-center">
        <BrandMark className="mb-8 justify-center" />
        <p className="font-mono text-sm text-lime">404 / RECORD NOT FOUND</p>
        <h1 className="mt-4 text-4xl tracking-[-0.05em] text-white">This route is outside the ledger.</h1>
        <p className="mt-4 text-sm leading-6 text-white/48">The page may have moved, or the address does not map to a VDA Ledger route.</p>
        <Link href="/" className={buttonClassName({ className: "mt-7" })}>Return home</Link>
      </div>
    </main>
  );
}

