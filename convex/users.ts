/**
 * MUSCLE-META MATRIX — CONVEX USER FUNCTIONS
 * ===========================================
 * File: /convex/users.ts
 *
 * Handles Clerk → Convex user sync and profile management.
 * Called on:
 *   - First sign-in (upsert creates the user record)
 *   - Profile updates (onboarding flow)
 *   - Dashboard loads (getByClerkId reactive query)
 *
 * Randy Bauer PT — Muscle-Meta Matrix™
 */
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
// ─────────────────────────────────────────────
// QUERIES
// ─────────────────────────────────────────────
/**
 * getByClerkId
 * Primary user lookup — called on every authenticated page load.
 * Reactive: component re-renders automatically when user data changes.
 */
export const getByClerkId = query({
  args: { clerkUserId: v.string() },
  handler: async (ctx, { clerkUserId }) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", clerkUserId))
      .unique();
  },
});
/**
 * getById
 * Internal lookup by Convex document ID.
 */
export const getById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db.get(userId);
  },
});
/**
 * getAllUsers
 * Admin only — returns all users for the admin dashboard.
 * Randy's management view.
 */
export const getAllUsers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("users").order("desc").collect();
  },
});
/**
 * getUsersByRiskTier
 * Admin — filter users by risk tier for targeted outreach.
 */
export const getUsersByRiskTier = query({
  args: {
    riskTier: v.union(
      v.literal("MINIMAL"),
      v.literal("LOW"),
      v.literal("MODERATE"),
      v.literal("HIGH"),
      v.literal("CRITICAL")
    ),
  },
  handler: async (ctx, { riskTier }) => {
    return await ctx.db
      .query("users")
      .withIndex("by_risk_tier", (q) => q.eq("latestRiskTier", riskTier))
      .collect();
  },
});
// ─────────────────────────────────────────────
// MUTATIONS
// ─────────────────────────────────────────────
/**
 * upsertFromClerk
 * Called on sign-in and sign-up via Clerk webhook or
 * ConvexClientProvider on first authenticated load.
 * Creates user if not exists, updates if exists.
 */
export const upsertFromClerk = mutation({
  args: {
    clerkUserId: v.string(),
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
  },
  handler: async (ctx, { clerkUserId, email, firstName, lastName }) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", clerkUserId))
      .unique();
    const now = Date.now();
    if (existing) {
      // Update name/email if changed in Clerk
      await ctx.db.patch(existing._id, {
        email,
        firstName,
        lastName,
        updatedAt: now,
      });
      return existing._id;
    }
    // Create new user with FREE tier defaults
    const userId = await ctx.db.insert("users", {
      clerkUserId,
      email,
      firstName,
      lastName,
      role: "USER",
      tier: "FREE",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
    return userId;
  },
});
/**
 * updateProfile
 * Called during onboarding flow — captures age, sex,
 * weight, goals, and population flags before assessment starts.
 */
export const updateProfile = mutation({
  args: {
    clerkUserId: v.string(),
    age: v.optional(v.number()),
    sex: v.optional(
      v.union(v.literal("MALE"), v.literal("FEMALE"), v.literal("OTHER"))
    ),
    heightCm: v.optional(v.number()),
    weightKg: v.optional(v.number()),
    primaryGoal: v.optional(v.string()),
    isGLP1User: v.optional(v.boolean()),
    isPostSurgical: v.optional(v.boolean()),
    isPostHospital: v.optional(v.boolean()),
    isPickleballPlayer: v.optional(v.boolean()),
  },
  handler: async (ctx, { clerkUserId, ...profileData }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", clerkUserId))
      .unique();
    if (!user) throw new Error(`User not found: ${clerkUserId}`);
    await ctx.db.patch(user._id, {
      ...profileData,
      onboardedAt: Date.now(),
      updatedAt: Date.now(),
    });
    return user._id;
  },
});
/**
 * upgradeToFounding
 * Called when a user joins the founding cohort ($47/mo).
 * Randy manually triggers this after payment confirmation.
 */
export const upgradeToFounding = mutation({
  args: { clerkUserId: v.string() },
  handler: async (ctx, { clerkUserId }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", clerkUserId))
      .unique();
    if (!user) throw new Error(`User not found: ${clerkUserId}`);
    await ctx.db.patch(user._id, {
      tier: "FOUNDING",
      updatedAt: Date.now(),
    });
    return user._id;
  },
});
/**
 * updateLatestAssessmentSnapshot
 * Denormalized snapshot on user record for fast dashboard loads.
 * Called by the scoring engine after results are computed.
 */
export const updateLatestAssessmentSnapshot = mutation({
  args: {
    userId: v.id("users"),
    riskTier: v.union(
      v.literal("MINIMAL"),
      v.literal("LOW"),
      v.literal("MODERATE"),
      v.literal("HIGH"),
      v.literal("CRITICAL")
    ),
    assessmentType: v.string(),
  },
  handler: async (ctx, { userId, riskTier, assessmentType }) => {
    await ctx.db.patch(userId, {
      latestRiskTier: riskTier,
      latestAssessmentType: assessmentType as any,
      latestAssessmentAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});
/**
 * ADD THIS TO THE BOTTOM OF /convex/users.ts
 * ===========================================
 * One additional mutation needed for the Clerk webhook handler.
 * Paste this at the end of your existing users.ts file.
 */
/**
 * deactivateUser
 * Called by Clerk webhook on user.deleted event.
 * Soft delete — preserves assessment data for records.
 */
export const deactivateUser = mutation({
  args: { clerkUserId: v.string() },
  handler: async (ctx, { clerkUserId }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", clerkUserId))
      .unique();
    if (!user) return null;
    await ctx.db.patch(user._id, {
      isActive:  false,
      updatedAt: Date.now(),
    });
    return user._id;
  },
});
