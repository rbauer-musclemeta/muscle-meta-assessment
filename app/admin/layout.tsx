/**
 * MUSCLE-META MATRIX™ — ADMIN LAYOUT
 * =====================================
 * File: /app/admin/layout.tsx
 *
 * Wraps all /admin/* routes.
 * Redirects non-admins to /dashboard.
 *
 * Randy Bauer PT — Muscle-Meta Matrix™
 */
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
const ADMIN_CLERK_IDS = [
  process.env.ADMIN_CLERK_USER_ID ?? "",
].filter(Boolean);
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();
  if (!user) redirect("/sign-in");
  if (ADMIN_CLERK_IDS.length > 0 && !ADMIN_CLERK_IDS.includes(user.id)) {
    redirect("/dashboard");
  }
  return <>{children}</>;
}
