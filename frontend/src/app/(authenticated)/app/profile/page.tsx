import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";

import { ProfileView } from "@/features/user/profile-view";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  await auth.protect();
  return <ProfileView />;
}

