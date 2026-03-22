/**
 * MUSCLE-META MATRIX™ — CLERK WEBHOOK HANDLER
 * =============================================
 * File: /app/api/webhooks/clerk/route.ts
 *
 * Listens for Clerk user events and syncs to Convex.
 * Events handled:
 *   user.created  → upsertFromClerk (creates Convex user record)
 *   user.updated  → upsertFromClerk (syncs name/email changes)
 *   user.deleted  → marks user inactive in Convex
 *
 * Setup requirements:
 *   1. Install svix: already in package.json
 *   2. Add CLERK_WEBHOOK_SECRET to Vercel env vars
 *   3. Register webhook URL in Clerk dashboard
 *
 * Clerk Dashboard → Webhooks → Add Endpoint:
 *   URL: https://your-domain.vercel.app/api/webhooks/clerk
 *   Events: user.created, user.updated, user.deleted
 *
 * Randy Bauer PT — Muscle-Meta Matrix™
 */
import { Webhook } from "svix";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
const convex = new ConvexHttpClient(
  process.env.NEXT_PUBLIC_CONVEX_URL as string
);
export async function POST(req: Request) {
  // ── Verify webhook signature ──
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET) {
    console.error("CLERK_WEBHOOK_SECRET not set");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }
  const headerPayload = headers();
  const svix_id        = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json(
      { error: "Missing svix headers" },
      { status: 400 }
    );
  }
  const payload = await req.json();
  const body    = JSON.stringify(payload);
  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: any;
  try {
    evt = wh.verify(body, {
      "svix-id":        svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    });
  } catch (err) {
    console.error("Webhook verification failed:", err);
    return NextResponse.json(
      { error: "Invalid webhook signature" },
      { status: 400 }
    );
  }
  // ── Handle events ──
  const { type, data } = evt;
  try {
    if (type === "user.created" || type === "user.updated") {
      await convex.mutation(api.users.upsertFromClerk, {
        clerkUserId: data.id,
        email:       data.email_addresses?.[0]?.email_address ?? "",
        firstName:   data.first_name  ?? undefined,
        lastName:    data.last_name   ?? undefined,
      });
      console.log(`✓ Synced Clerk user ${data.id} to Convex`);
    }
    if (type === "user.deleted") {
      // Soft delete — mark inactive rather than destroy data
      await convex.mutation(api.users.deactivateUser, {
        clerkUserId: data.id,
      });
      console.log(`✓ Deactivated Clerk user ${data.id} in Convex`);
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(`Webhook handler error for ${type}:`, err);
    return NextResponse.json(
      { error: "Handler failed" },
      { status: 500 }
    );
  }
}
