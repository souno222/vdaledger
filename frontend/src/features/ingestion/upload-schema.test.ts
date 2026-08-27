import { describe, expect, it } from "vitest";

import { uploadSchema } from "@/features/ingestion/upload-view";

describe("exchange CSV upload validation", () => {
  it.each(["BINANCE", "COINDCX"] as const)(
    "accepts a %s CSV at the backend upload limit",
    (exchange) => {
      const file = new File(
        [new Uint8Array(20 * 1024 * 1024)],
        "trades.csv",
        {
          type: "text/csv",
        },
      );

      expect(uploadSchema.safeParse({ exchange, file }).success).toBe(true);
    },
  );

  it("rejects unsupported exchanges", () => {
    const file = new File(["trade"], "trades.csv", { type: "text/csv" });

    expect(uploadSchema.safeParse({ exchange: "KRAKEN", file }).success).toBe(
      false,
    );
  });

  it("rejects non-CSV files and files over 20 MB", () => {
    const wrongType = new File(["trade"], "trades.txt", { type: "text/plain" });
    const tooLarge = new File(
      [new Uint8Array(20 * 1024 * 1024 + 1)],
      "trades.csv",
      { type: "text/csv" },
    );

    expect(
      uploadSchema.safeParse({ exchange: "BINANCE", file: wrongType }).success,
    ).toBe(false);
    expect(
      uploadSchema.safeParse({ exchange: "BINANCE", file: tooLarge }).success,
    ).toBe(false);
  });
});
