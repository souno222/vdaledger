import { describe, expect, it } from "vitest";

import { formatInr, formatInteger, formatQuantity, formatRate } from "@/lib/numbers";

describe("number presentation", () => {
  it("formats INR with Indian digit grouping", () => {
    expect(formatInr("123456.5")).toBe("₹1,23,456.50");
    expect(formatInteger(123456)).toBe("1,23,456");
  });

  it("formats values beyond JavaScript safe precision without coercion", () => {
    expect(formatInr("12345678901234567890.125")).toBe(
      "₹1,23,45,67,89,01,23,45,67,890.13",
    );
    expect(formatQuantity("12345678901234567890.123456789")).toBe(
      "1,23,45,67,89,01,23,45,67,890.123456789",
    );
  });

  it("preserves meaningful asset precision without calculating balances", () => {
    expect(formatQuantity("1234.56000000")).toBe("1,234.56");
    expect(formatQuantity("0.00000001")).toBe("0.00000001");
  });

  it("formats backend-supplied decimal rates as percentages", () => {
    expect(formatRate("0.3")).toBe("30%");
    expect(formatRate("4e-2")).toBe("4%");
  });

  it("uses a safe placeholder for malformed numeric data", () => {
    expect(formatInr("not-a-number")).toBe("—");
  });
});
