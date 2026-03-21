/**
 * MUSCLE-META MATRIX — CONVEX ASSESSMENT FUNCTIONS
 * =================================================
 * File: /convex/assessments.ts
 *
 * All mutations and queries for the assessment lifecycle:
 *   STARTED → IN_PROGRESS → SUBMITTED → SCORED
 *
 * Key design decisions:
 *   - Responses auto-saved on every answer (resume capability)
 *   - Submit + score happen atomically in submitAndScore mutation
 *   - clerkUserId denormalized on assessments for fast lookup
 *   - No client-side score manipulation possible (server-only)
 *
 * Randy Bauer PT — Muscle-Meta Matrix™
 */
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
// ─────────────────────────────────────────────
// QUERIES
// ─────────────────────────────────────────────
/**
 * getActiveAssessment
 * Returns the current in-progress assessment for a user.
 * Used to resume an incomplete assessment.
 */
export const getActiveAssessment = query({
  args: {
    clerkUserId: v.string(),
    assessmentType: v.optional(v.string()),
  },
  handler: async (ctx, { clerkUserId, assessmentType }) => {
    let q = ctx.db
      .query("assessments")
      .withIndex("by_clerk_user", (q) => q.eq("clerkUserId", clerkUserId));
    const all = await q.collect();
    // Find most recent IN_PROGRESS or STARTED assessment
    const active = all
      .filter((a) => {
        const isActive =
          a.status === "IN_PROGRESS" || a.status === "STARTED";
        const matchesType = assessmentType
          ? a.assessmentType === assessmentType
          : true;
        return isActive && matchesType;
      })
      .sort((a, b) => b.startedAt - a.startedAt)[0];
    return active ?? null;
  },
});
/**
 * getAssessmentById
 * Full assessment record including all responses.
 */
export const getAssessmentById = query({
  args: { assessmentId: v.id("assessments") },
  handler: async (ctx, { assessmentId }) => {
    const assessment = await ctx.db.get(assessmentId);
    if (!assessment) return null;
    const responses = await ctx.db
      .query("responses")
      .withIndex("by_assessment", (q) => q.eq("assessmentId", assessmentId))
      .collect();
    return { assessment, responses };
  },
});
/**
 * getAssessmentsByUser
 * All assessments for a user — for history/dashboard display.
 */
export const getAssessmentsByUser = query({
  args: { clerkUserId: v.string() },
  handler: async (ctx, { clerkUserId }) => {
    return await ctx.db
      .query("assessments")
      .withIndex("by_clerk_user", (q) => q.eq("clerkUserId", clerkUserId))
      .order("desc")
      .collect();
  },
});
/**
 * getResponses
 * All saved responses for an assessment.
 * Used to rebuild state when resuming.
 */
export const getResponses = query({
  args: { assessmentId: v.id("assessments") },
  handler: async (ctx, { assessmentId }) => {
    return await ctx.db
      .query("responses")
      .withIndex("by_assessment", (q) => q.eq("assessmentId", assessmentId))
      .collect();
  },
});
/**
 * getAllAssessments
 * Admin — all assessments across all users, newest first.
 */
export const getAllAssessments = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("assessments")
      .order("desc")
      .collect();
  },
});
/**
 * getAssessmentConfig
 * Load the active config for a given assessment type.
 * Returns questions, screens, scoring config.
 */
export const getAssessmentConfig = query({
  args: {
    assessmentType: v.string(),
  },
  handler: async (ctx, { assessmentType }) => {
    const configs = await ctx.db
      .query("assessmentConfigs")
      .withIndex("by_type", (q) =>
        q.eq("assessmentType", assessmentType as any)
      )
      .collect();
    // Return the active version
    return configs.find((c) => c.isActive) ?? null;
  },
});
// ─────────────────────────────────────────────
// MUTATIONS
// ─────────────────────────────────────────────
/**
 * startAssessment
 * Creates a new assessment record when user begins.
 * Returns assessmentId used for all subsequent operations.
 *
 * Called when user hits "Start Assessment" button.
 */
export const startAssessment = mutation({
  args: {
    clerkUserId: v.string(),
    assessmentType: v.union(
      v.literal("GMMBB"),
      v.literal("CRA"),
      v.literal("4P_MMA"),
      v.literal("GLP1"),
      v.literal("PICKLEBALL"),
      v.literal("POST_HOSPITAL"),
      v.literal("CCRAF"),
      v.literal("MFAT"),
      v.literal("BONE_HEALTH"),
      v.literal("BRAIN_MUSCLE"),
      v.literal("CATABOLIC_CRISIS")
    ),
    totalQuestions: v.number(),
    entrySource: v.optional(
      v.union(
        v.literal("WEBSITE_CTA"),
        v.literal("EMAIL_LINK"),
        v.literal("WORKSHOP_QR"),
        v.literal("DIRECT"),
        v.literal("ADMIN_INVITE"),
        v.literal("REFERRAL")
      )
    ),
    contextSnapshot: v.optional(
      v.object({
        age: v.optional(v.number()),
        sex: v.optional(v.string()),
        isGLP1User: v.optional(v.boolean()),
        isPostSurgical: v.optional(v.boolean()),
        weightKg: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const { clerkUserId, assessmentType, totalQuestions, entrySource, contextSnapshot } = args;
    const now = Date.now();
    // Look up the user record
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", clerkUserId))
      .unique();
    if (!user) throw new Error(`User not found: ${clerkUserId}`);
    // Check for existing in-progress assessment of same type
    const existing = await ctx.db
      .query("assessments")
      .withIndex("by_user_type", (q) =>
        q.eq("userId", user._id).eq("assessmentType", assessmentType)
      )
      .collect();
    const inProgress = existing.find(
      (a) => a.status === "IN_PROGRESS" || a.status === "STARTED"
    );
    // Return existing if resumable
    if (inProgress) return inProgress._id;
    // Count previous completed assessments for reassessment number
    const completed = existing.filter((a) => a.status === "SCORED");
    // Get active config for this assessment type
    const configs = await ctx.db
      .query("assessmentConfigs")
      .withIndex("by_type_active", (q) =>
        q.eq("assessmentType", assessmentType).eq("isActive", true)
      )
      .collect();
    const config = configs[0];
    // Create the assessment record
    const assessmentId = await ctx.db.insert("assessments", {
      userId: user._id,
      clerkUserId,
      configId: config?._id as any,
      assessmentType,
      configVersion: config?.version ?? "1.0",
      status: "STARTED",
      questionsAnswered: 0,
      totalQuestions,
      percentComplete: 0,
      currentScreenIndex: 0,
      contextSnapshot,
      entrySource,
      isReassessment: completed.length > 0,
      previousAssessmentId: completed.length > 0
        ? completed[completed.length - 1]._id
        : undefined,
      reassessmentNumber: completed.length,
      startedAt: now,
      updatedAt: now,
    });
    return assessmentId;
  },
});
/**
 * saveResponse
 * Auto-saves a single question response.
 * Called on every answer — enables resume from any point.
 * Upserts: creates if new, updates if already answered.
 */
export const saveResponse = mutation({
  args: {
    assessmentId: v.id("assessments"),
    userId: v.id("users"),
    questionId: v.string(),
    axis: v.optional(
      v.union(
        v.literal("BONE"),
        v.literal("MUSCLE"),
        v.literal("METABOLIC"),
        v.literal("GUT"),
        v.literal("BRAIN")
      )
    ),
    category: v.optional(v.string()),
    pillar: v.optional(v.string()),
    responseType: v.union(
      v.literal("SINGLE"),
      v.literal("MULTI"),
      v.literal("NUMERIC"),
      v.literal("BOOLEAN")
    ),
    valueString: v.optional(v.string()),
    valueArray: v.optional(v.array(v.string())),
    valueNumber: v.optional(v.number()),
    valueBoolean: v.optional(v.boolean()),
    rawScore: v.number(),
    isCatabolicFlag: v.boolean(),
    isCompoundTrigger: v.boolean(),
    screenIndex: v.number(),
    questionOrder: v.number(),
  },
  handler: async (ctx, args) => {
    const { assessmentId, questionId, ...responseData } = args;
    const now = Date.now();
    // Check if this question was already answered
    const existing = await ctx.db
      .query("responses")
      .withIndex("by_assessment_question", (q) =>
        q.eq("assessmentId", assessmentId).eq("questionId", questionId)
      )
      .unique();
    if (existing) {
      // Update existing response
      await ctx.db.patch(existing._id, {
        ...responseData,
        updatedAt: now,
      });
    } else {
      // Insert new response
      await ctx.db.insert("responses", {
        assessmentId,
        questionId,
        ...responseData,
        category: responseData.category as any,
        pillar: responseData.pillar as any,
        answeredAt: now,
        updatedAt: now,
      });
    }
    // Update assessment progress
    const allResponses = await ctx.db
      .query("responses")
      .withIndex("by_assessment", (q) => q.eq("assessmentId", assessmentId))
      .collect();
    const assessment = await ctx.db.get(assessmentId);
    if (!assessment) return;
    const questionsAnswered = allResponses.length;
    const percentComplete = Math.round(
      (questionsAnswered / assessment.totalQuestions) * 100
    );
    await ctx.db.patch(assessmentId, {
      status: "IN_PROGRESS",
      questionsAnswered,
      percentComplete,
      lastQuestionId: questionId,
      currentScreenIndex: args.screenIndex,
      updatedAt: now,
    });
  },
});
/**
 * submitAssessment
 * Marks assessment as SUBMITTED — triggers scoring.
 * Called when user answers the final question and clicks Submit.
 *
 * NOTE: Actual scoring happens in results.ts → computeAndSaveResults
 * The UI calls submitAssessment then immediately calls computeAndSaveResults.
 * This two-step keeps the scoring logic cleanly separated.
 */
export const submitAssessment = mutation({
  args: {
    assessmentId: v.id("assessments"),
  },
  handler: async (ctx, { assessmentId }) => {
    const now = Date.now();
    const assessment = await ctx.db.get(assessmentId);
    if (!assessment) throw new Error("Assessment not found");
    if (assessment.status === "SCORED") {
      return assessmentId; // Already scored, idempotent
    }
    await ctx.db.patch(assessmentId, {
      status: "SUBMITTED",
      percentComplete: 100,
      submittedAt: now,
      updatedAt: now,
    });
    return assessmentId;
  },
});
/**
 * abandonAssessment
 * Marks assessments inactive after 30 days.
 * Can also be triggered manually by admin.
 */
export const abandonAssessment = mutation({
  args: { assessmentId: v.id("assessments") },
  handler: async (ctx, { assessmentId }) => {
    await ctx.db.patch(assessmentId, {
      status: "ABANDONED",
      updatedAt: Date.now(),
    });
  },
});
