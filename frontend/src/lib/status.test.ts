import { describe, expect, it } from "vitest";

import { humanizeCode, ingestionStatusLabels } from "@/lib/status";

describe("backend code presentation", () => {
  it("maps every ingestion status to visible language", () => {
    expect(Object.keys(ingestionStatusLabels)).toEqual([
      "PENDING",
      "PROCESSING",
      "COMPLETED",
      "COMPLETED_WITH_ERRORS",
      "FAILED",
    ]);
    expect(ingestionStatusLabels.COMPLETED_WITH_ERRORS).toBe(
      "Completed with errors",
    );
  });

  it("uses curated and fallback labels for backend codes", () => {
    expect(humanizeCode("INVALID_NUMERIC_VALUE")).toBe("Invalid numeric value");
    expect(humanizeCode("FUTURE_BACKEND_CODE")).toBe("Future backend code");
  });
});
