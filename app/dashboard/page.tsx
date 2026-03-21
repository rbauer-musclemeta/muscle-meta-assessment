import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");
  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-serif text-[#1A2B4A] mb-2">
          Welcome back, {user.firstName ?? "there"}
        </h1>
        <p className="text-[#009090] font-sans">Your GMMBB dashboard — coming soon.</p>
      </div>
    </main>
  );
}
