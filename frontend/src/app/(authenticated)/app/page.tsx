import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function AppIndexPage() {
  await auth.protect();
  redirect("/app/dashboard");
}

