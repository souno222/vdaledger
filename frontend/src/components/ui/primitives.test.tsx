import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StatusBadge } from "@/components/ui/primitives";

describe("StatusBadge", () => {
  it("does not rely on color alone to communicate status", () => {
    render(<StatusBadge status="COMPLETED_WITH_ERRORS" />);

    const label = screen.getByText("Completed with errors");
    const badge = label.closest("span");

    expect(label).toBeVisible();
    expect(badge).toHaveTextContent("Completed with errors");
    expect(badge?.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });
});

