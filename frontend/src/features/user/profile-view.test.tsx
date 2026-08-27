import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ProfileView } from "@/features/user/profile-view";

const clerkUserId = "user_private_clerk_identifier";
const internalUserId = "6c73c08a-c60e-49d1-95d2-791f7af62d97";

vi.mock("@clerk/nextjs", () => ({
  useClerk: () => ({ signOut: vi.fn() }),
  useUser: () => ({
    isLoaded: true,
    user: {
      id: clerkUserId,
      primaryEmailAddress: { emailAddress: "investor@example.com" },
      createdAt: new Date("2026-07-18T09:00:00Z"),
      unsafeMetadata: { internalUserId },
    },
  }),
  UserProfile: () => <div>Clerk account controls</div>,
}));

describe("ProfileView identity minimization", () => {
  it("shows useful profile fields without rendering either user identifier", () => {
    render(<ProfileView />);

    expect(screen.getByText("investor@example.com")).toBeVisible();
    expect(screen.getByText("Member since")).toBeVisible();
    expect(screen.queryByText("Internal user ID")).not.toBeInTheDocument();
    expect(screen.queryByText("Clerk identifier")).not.toBeInTheDocument();
    expect(screen.queryByText(clerkUserId)).not.toBeInTheDocument();
    expect(screen.queryByText(internalUserId)).not.toBeInTheDocument();
  });
});
