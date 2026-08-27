"use client";

export default function GlobalError({
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#06130A", color: "#F8FBF7", fontFamily: "Arial, sans-serif" }}>
        <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, textAlign: "center" }}>
          <div><p style={{ color: "#C8F542", fontSize: 12 }}>GLOBAL ERROR</p><h1>The application could not start.</h1><button type="button" onClick={unstable_retry} style={{ marginTop: 20, minHeight: 44, border: 0, borderRadius: 999, padding: "0 20px", background: "#C8F542", color: "#06130A", cursor: "pointer" }}>Try again</button></div>
        </main>
      </body>
    </html>
  );
}

