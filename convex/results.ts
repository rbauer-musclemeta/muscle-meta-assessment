/**
 * MUSCLE-META MATRIX — CONVEX RESULTS FUNCTIONS
 * ==============================================
 * File: /convex/results.ts
 *
 * Scoring, results storage, and action plan generation.
 *
 * GMMBB Weighted Scoring Model:
 *   Bone:      25% of total score
 *   Muscle:    25% of total score
 *   Metabolic: 20% of total score
 *   Gut:       15% of total score
 *   Brain:     15% of total score
 *
 * Compound risk detection:
 *   - Osteosarcopenia: Bone HIGH + Muscle HIGH (58% of hip fx patients)
 *   - GLP-1 unprotected loss: GLP-1 user + Muscle HIGH/CRITICAL
 *   - Early bone window: Bone CRITICAL before Muscle HIGH
 *   - Catabolic cascade: 3+ catabolic flags in single axis
 *
 * Randy Bauer PT — Muscle-Meta Matrix™
 */
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
// ─────────────────────────────────────────────
// SCORING CONSTANTS
// ─────────────────────────────────────────────
const GMMBB_WEIGHTS = {
  BONE:      0.25,
  MUSCLE:    0.25,
  METABOLIC: 0.20,
  GUT:       0.15,
  BRAIN:     0.15,
} as const;
const RISK_THRESHOLDS = {
  MINIMAL:  0,
  LOW:      21,
  MODERATE: 41,
  HIGH:     61,
  CRITICAL: 81,
} as const;
type RiskTier = "MINIMAL" | "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
type GmmbbAxis = "BONE" | "MUSCLE" | "METABOLIC" | "GUT" | "BRAIN";
// ─────────────────────────────────────────────
// PURE SCORING FUNCTIONS (no DB access)
// ─────────────────────────────────────────────
function getRiskTier(percentScore: number): RiskTier {
  if (percentScore >= RISK_THRESHOLDS.CRITICAL) return "CRITICAL";
  if (percentScore >= RISK_THRESHOLDS.HIGH)     return "HIGH";
  if (percentScore >= RISK_THRESHOLDS.MODERATE) return "MODERATE";
  if (percentScore >= RISK_THRESHOLDS.LOW)      return "LOW";
  return "MINIMAL";
}
function calculateAxisScore(
  responses: any[],
  axis: GmmbbAxis,
  maxPerAxis: number
) {
  const axisResponses = responses.filter((r) => r.axis === axis);
  const rawScore = axisResponses.reduce((sum, r) => sum + (r.rawScore ?? 0), 0);
  const weight = GMMBB_WEIGHTS[axis];
  const weightedScore = rawScore * weight;
  const percentile = Math.min(Math.round((rawScore / maxPerAxis) * 100), 100);
  return {
    rawScore,
    weightedScore,
    percentile,
    riskTier: getRiskTier(percentile) as RiskTier,
    questionCount: axisResponses.length,
  };
}
/**
 * generateActionPlan
 * Converts risk tier + axis scores into a personalized action plan.
 * This is the clinical intelligence layer.
 */
function generateActionPlan(
  riskTier: RiskTier,
  axisScores: Record<GmmbbAxis, { riskTier: RiskTier; percentile: number }>,
  contextSnapshot?: any
) {
  const headlines: Record<RiskTier, string> = {
    CRITICAL: "Immediate intervention required — your muscle-metabolic system needs urgent support",
    HIGH:     "Significant risk detected — structured intervention recommended now",
    MODERATE: "Moderate risk identified — guided program will accelerate recovery",
    LOW:      "Low risk profile — optimization focus will maximize your potential",
    MINIMAL:  "Excellent baseline — advanced performance protocols available",
  };
  // Sort axes by risk level (highest first) for priorities
  const axisRanking: GmmbbAxis[] = (
    Object.entries(axisScores) as [GmmbbAxis, { riskTier: RiskTier; percentile: number }][]
  )
    .sort((a, b) => b[1].percentile - a[1].percentile)
    .map(([axis]) => axis);
  // Build top 3 priority items
  const priorityDescriptions: Record<GmmbbAxis, Record<RiskTier, string>> = {
    BONE: {
      CRITICAL: "Bone density loss detected — fracture risk elevated. DEXA scan and PT consultation urgent.",
      HIGH:     "Bone health compromised — resistance training and calcium/D3 protocol needed immediately.",
      MODERATE: "Early bone loss indicators — weight-bearing exercise program recommended.",
      LOW:      "Minor bone health considerations — optimize calcium intake and impact training.",
      MINIMAL:  "Bone health strong — maintain with current resistance training.",
    },
    MUSCLE: {
      CRITICAL: "Severe sarcopenia risk — muscle wasting accelerating. Immediate protein + resistance protocol.",
      HIGH:     "Significant muscle loss risk — structured resistance training + 1.6–2.0g protein/kg required.",
      MODERATE: "Muscle quality declining — progressive overload program + leucine optimization needed.",
      LOW:      "Mild muscle concerns — optimize protein timing and add resistance training.",
      MINIMAL:  "Muscle health excellent — maintain with progressive overload.",
    },
    METABOLIC: {
      CRITICAL: "Metabolic crisis indicators — insulin resistance, energy dysregulation. Medical evaluation needed.",
      HIGH:     "Metabolic flexibility severely impaired — dietary reset + movement protocol required.",
      MODERATE: "Metabolic dysfunction present — carb cycling and fasting protocols recommended.",
      LOW:      "Mild metabolic inflexibility — reduce refined carbs, add Zone 2 cardio.",
      MINIMAL:  "Metabolic health strong — advanced optimization available.",
    },
    GUT: {
      CRITICAL: "Gut-muscle axis severely disrupted — nutrient absorption compromised. GI evaluation recommended.",
      HIGH:     "Significant gut dysfunction — probiotic protocol + elimination diet assessment needed.",
      MODERATE: "Gut health suboptimal — fiber diversity increase and probiotic support recommended.",
      LOW:      "Minor gut considerations — fermented foods and prebiotic fiber can optimize.",
      MINIMAL:  "Gut health strong — maintain with diverse fiber intake.",
    },
    BRAIN: {
      CRITICAL: "Neuromuscular and cognitive decline indicators — urgent neurological evaluation recommended.",
      HIGH:     "Brain-muscle connection compromised — cognitive training + balance protocol required.",
      MODERATE: "Cognitive-physical performance declining — dual-task training and sleep optimization needed.",
      LOW:      "Mild brain health considerations — add balance challenges and cognitive exercise.",
      MINIMAL:  "Brain-muscle connection strong — advanced neuromuscular training available.",
    },
  };
  const topPriorities = axisRanking.slice(0, 3).map((axis, i) => ({
    rank: i + 1,
    axis,
    title: `${axis.charAt(0) + axis.slice(1).toLowerCase()} Axis Intervention`,
    description: priorityDescriptions[axis][axisScores[axis].riskTier],
    urgency: (
      axisScores[axis].riskTier === "CRITICAL" ? "IMMEDIATE" :
      axisScores[axis].riskTier === "HIGH"     ? "THIS_WEEK" :
      "THIS_MONTH"
    ) as "IMMEDIATE" | "THIS_WEEK" | "THIS_MONTH",
  }));
  // Referral logic
  const referrals = [];
  if (riskTier === "CRITICAL" || riskTier === "HIGH") {
    referrals.push({
      specialty: "Physical Therapist",
      urgency: riskTier === "CRITICAL" ? "URGENT" : "SOON" as "URGENT" | "SOON" | "ROUTINE",
      reason: "Functional movement assessment and resistance training program design",
    });
  }
  if (axisScores.METABOLIC.riskTier === "HIGH" || axisScores.METABOLIC.riskTier === "CRITICAL") {
    referrals.push({
      specialty: "Registered Dietitian",
      urgency: "SOON" as "URGENT" | "SOON" | "ROUTINE",
      reason: "Metabolic reset protocol and protein optimization",
    });
  }
  if (axisScores.BONE.riskTier === "CRITICAL") {
    referrals.push({
      specialty: "Endocrinologist / Rheumatologist",
      urgency: "URGENT" as "URGENT" | "SOON" | "ROUTINE",
      reason: "DEXA scan and bone density management",
    });
  }
  // Protein prescription based on risk tier
  const proteinByTier: Record<RiskTier, number> = {
    CRITICAL: 2.5,
    HIGH:     2.0,
    MODERATE: 1.8,
    LOW:      1.6,
    MINIMAL:  1.2,
  };
  const bodyWeightKg = contextSnapshot?.weightKg ?? 75;
  const dailyProteinGrams = Math.round(proteinByTier[riskTier] * bodyWeightKg);
  const nutritionPrescription = {
    dailyProteinGrams,
    proteinPerMealGrams: Math.round(dailyProteinGrams / 3),
    leucineThresholdMet: Math.round(dailyProteinGrams / 3) >= 30, // ~2.5g leucine per 30g protein
    creatineRecommended: riskTier === "HIGH" || riskTier === "CRITICAL",
    hmb_recommended: riskTier === "CRITICAL",
    priorityFoods: [
      "Whey protein isolate (post-workout)",
      "Eggs (2–3 per day)",
      "Wild-caught salmon (2x/week)",
      "Greek yogurt (leucine-rich)",
      "Lean beef or bison (3x/week)",
    ],
  };
  // Exercise prescription
  const exercisePrescription = {
    weeklyFrequency: riskTier === "CRITICAL" ? 5 : riskTier === "HIGH" ? 4 : 3,
    sessionDurationMin: riskTier === "CRITICAL" ? 30 : 45,
    primaryFocus: axisScores.MUSCLE.percentile > axisScores.BONE.percentile
      ? "Resistance training — muscle preservation priority"
      : "Weight-bearing impact — bone density priority",
    vilpaIntegration: riskTier === "MODERATE" || riskTier === "LOW" || riskTier === "MINIMAL",
    progressionPhase: (
      riskTier === "CRITICAL" ? "FOUNDATION" :
      riskTier === "HIGH"     ? "BUILDING" :
      riskTier === "MODERATE" ? "OPTIMIZATION" :
      "MASTERY"
    ) as "FOUNDATION" | "BUILDING" | "OPTIMIZATION" | "MASTERY",
  };
  // Recovery protocol
  const recoveryProtocol = {
    sleepTargetHours: riskTier === "CRITICAL" ? 9 : 8,
    stressProtocol: riskTier === "CRITICAL"
      ? "Daily HRV monitoring, cortisol management, medical support"
      : "Diaphragmatic breathing, 10-min daily mindfulness, sleep hygiene",
    monitoringFreq: (
      riskTier === "CRITICAL" ? "DAILY" :
      riskTier === "HIGH"     ? "WEEKLY" :
      riskTier === "MODERATE" ? "BIWEEKLY" :
      "MONTHLY"
    ) as "DAILY" | "WEEKLY" | "BIWEEKLY" | "MONTHLY",
  };
  return {
    headline: headlines[riskTier],
    topPriorities,
    referrals,
    nutritionPrescription,
    exercisePrescription,
    recoveryProtocol,
  };
}
// ─────────────────────────────────────────────
// QUERIES
// ─────────────────────────────────────────────
/**
 * getResultsByAssessment
 * Primary results query — called on results dashboard.
 * Returns full result including axis scores + action plan.
 */
export const getResultsByAssessment = query({
  args: { assessmentId: v.id("assessments") },
  handler: async (ctx, { assessmentId }) => {
    return await ctx.db
      .query("results")
      .withIndex("by_assessment", (q) => q.eq("assessmentId", assessmentId))
      .unique();
  },
});
/**
 * getLatestResultByUser
 * Dashboard snapshot — most recent scored result for a user.
 */
export const getLatestResultByUser = query({
  args: { clerkUserId: v.string() },
  handler: async (ctx, { clerkUserId }) => {
    const results = await ctx.db
      .query("results")
      .withIndex("by_clerk_user", (q) => q.eq("clerkUserId", clerkUserId))
      .order("desc")
      .collect();
    return results[0] ?? null;
  },
});
/**
 * getResultsByRiskTier
 * Admin — cohort analysis by risk tier.
 */
export const getResultsByRiskTier = query({
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
      .query("results")
      .withIndex("by_risk_tier", (q) => q.eq("riskTier", riskTier))
      .collect();
  },
});
// ─────────────────────────────────────────────
// MUTATIONS
// ─────────────────────────────────────────────
/**
 * computeAndSaveResults
 * THE CORE SCORING MUTATION.
 *
 * Called immediately after submitAssessment.
 * Runs entirely server-side — no client score manipulation possible.
 *
 * Steps:
 *   1. Load all responses for assessment
 *   2. Calculate axis scores (GMMBB weighted model)
 *   3. Detect compound risks
 *   4. Generate personalized action plan
 *   5. Save results to DB
 *   6. Update assessment status to SCORED
 *   7. Update user's denormalized risk tier snapshot
 */
export const computeAndSaveResults = mutation({
  args: {
    assessmentId: v.id("assessments"),
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
  },
  handler: async (ctx, { assessmentId, assessmentType }) => {
    const now = Date.now();
    // Load assessment
    const assessment = await ctx.db.get(assessmentId);
    if (!assessment) throw new Error("Assessment not found");
    if (assessment.status === "SCORED") {
      // Idempotent — return existing result
      const existing = await ctx.db
        .query("results")
        .withIndex("by_assessment", (q) => q.eq("assessmentId", assessmentId))
        .unique();
      return existing?._id;
    }
    // Load all responses
    const responses = await ctx.db
      .query("responses")
      .withIndex("by_assessment", (q) => q.eq("assessmentId", assessmentId))
      .collect();
    // ── GMMBB Weighted Scoring ──
    // Each axis has a different question count, so we estimate max per axis
    // based on average question score of 10 * question count
    const axisQuestionCounts: Record<GmmbbAxis, number> = {
      BONE:      9,  // 9 bone-related questions
      MUSCLE:    10, // 10 muscle questions
      METABOLIC: 10, // 10 metabolic questions
      GUT:       9,  // 9 gut questions
      BRAIN:     8,  // 8 brain questions
    };
    const axisScores = {
      BONE:      calculateAxisScore(responses, "BONE",      axisQuestionCounts.BONE      * 10),
      MUSCLE:    calculateAxisScore(responses, "MUSCLE",    axisQuestionCounts.MUSCLE    * 10),
      METABOLIC: calculateAxisScore(responses, "METABOLIC", axisQuestionCounts.METABOLIC * 10),
      GUT:       calculateAxisScore(responses, "GUT",       axisQuestionCounts.GUT       * 10),
      BRAIN:     calculateAxisScore(responses, "BRAIN",     axisQuestionCounts.BRAIN     * 10),
    };
    // Weighted total score (0–100)
    const totalWeightedScore =
      axisScores.BONE.percentile      * GMMBB_WEIGHTS.BONE +
      axisScores.MUSCLE.percentile    * GMMBB_WEIGHTS.MUSCLE +
      axisScores.METABOLIC.percentile * GMMBB_WEIGHTS.METABOLIC +
      axisScores.GUT.percentile       * GMMBB_WEIGHTS.GUT +
      axisScores.BRAIN.percentile     * GMMBB_WEIGHTS.BRAIN;
    const percentScore = Math.round(totalWeightedScore);
    const riskTier = getRiskTier(percentScore);
    // ── Compound Risk Detection ──
    const compoundFlagIds: Id<"compoundRiskFlags">[] = [];
    // 1. Osteosarcopenia: Bone HIGH/CRITICAL + Muscle HIGH/CRITICAL
    const boneHigh = ["HIGH", "CRITICAL"].includes(axisScores.BONE.riskTier);
    const muscleHigh = ["HIGH", "CRITICAL"].includes(axisScores.MUSCLE.riskTier);
    // Placeholder result ID — we'll create results first, then flags
    // We need to insert results before flags due to the FK relationship
    // So we save compound risks after the result insert below
    // ── Protective Factors ──
    // Check context for active protective factors
    const protectiveFactors: { factorId: string; description: string; scoreReduction: number }[] = [];
    // Future: check onboarding answers for creatine, HMB, HRT use
    const adjustedScore = Math.max(0, percentScore - protectiveFactors.reduce(
      (sum, f) => sum + f.scoreReduction, 0
    ));
    // ── Generate Action Plan ──
    const actionPlan = generateActionPlan(
      riskTier,
      axisScores,
      assessment.contextSnapshot
    );
    // ── Save Result ──
    const resultId = await ctx.db.insert("results", {
      assessmentId,
      userId: assessment.userId,
      clerkUserId: assessment.clerkUserId,
      assessmentType,
      totalScore: percentScore,
      maxScore: 100,
      percentScore,
      riskTier,
      axisScores,
      compoundRisksDetected: [], // updated below
      hasCompoundRisk: false,    // updated below
      protectiveFactorsApplied: protectiveFactors,
      adjustedScore,
      actionPlan,
      computedAt: now,
    });
    // ── Compound Risk Flags ──
    const flagIds: Id<"compoundRiskFlags">[] = [];
    if (boneHigh && muscleHigh) {
      const flagId = await ctx.db.insert("compoundRiskFlags", {
        resultId,
        assessmentId,
        userId: assessment.userId,
        compoundType: "OSTEOSARCOPENIA",
        severity: axisScores.BONE.riskTier === "CRITICAL" && axisScores.MUSCLE.riskTier === "CRITICAL"
          ? "URGENT" : "CONCERN",
        triggeringAxes: ["BONE", "MUSCLE"],
        triggeringQuestions: [],
        flagCount: 2,
        clinicalNote: "Concurrent bone and muscle compromise. 58% of hip fracture patients have osteosarcopenia. T-scores below -1.0 associated with 5x increased sarcopenia risk.",
        evidenceBasis: "Binkley et al. 2017 — Osteosarcopenia: Clinical Consequences",
        scoreBoostApplied: 10,
        recommendedAction: "DEXA scan + PT-supervised progressive resistance training + protein optimization (2.0–2.5g/kg)",
        urgentReferral: axisScores.BONE.riskTier === "CRITICAL",
        detectedAt: now,
      });
      flagIds.push(flagId);
    }
    // GLP-1 unprotected muscle loss
    if (assessment.contextSnapshot?.isGLP1User && muscleHigh) {
      const flagId = await ctx.db.insert("compoundRiskFlags", {
        resultId,
        assessmentId,
        userId: assessment.userId,
        compoundType: "GLP1_UNPROTECTED_LOSS",
        severity: "URGENT",
        triggeringAxes: ["MUSCLE"],
        triggeringQuestions: [],
        flagCount: 1,
        clinicalNote: "GLP-1 medication use with high muscle risk. 25–39% muscle mass loss documented in GLP-1 users without resistance training protection protocol.",
        scoreBoostApplied: 8,
        recommendedAction: "Immediate resistance training protocol + leucine supplementation + HMB consideration",
        urgentReferral: true,
        detectedAt: now,
      });
      flagIds.push(flagId);
    }
    // Early bone window: Bone CRITICAL with Muscle still HIGH (not yet CRITICAL)
    if (axisScores.BONE.riskTier === "CRITICAL" && axisScores.MUSCLE.riskTier === "HIGH") {
      const flagId = await ctx.db.insert("compoundRiskFlags", {
        resultId,
        assessmentId,
        userId: assessment.userId,
        compoundType: "EARLY_BONE_WINDOW",
        severity: "URGENT",
        triggeringAxes: ["BONE", "MUSCLE"],
        triggeringQuestions: [],
        flagCount: 2,
        clinicalNote: "Bone loss precedes muscle wasting by 7–14 days. You are in the critical early intervention window. Acting now prevents catabolic cascade.",
        scoreBoostApplied: 12,
        recommendedAction: "Immediate weight-bearing exercise + calcium/D3/K2 protocol + resistance training initiation",
        urgentReferral: true,
        detectedAt: now,
      });
      flagIds.push(flagId);
    }
    // Catabolic cascade: 3+ catabolic flags in responses
    const catabolicFlags = responses.filter((r) => r.isCatabolicFlag);
    if (catabolicFlags.length >= 3) {
      const flagId = await ctx.db.insert("compoundRiskFlags", {
        resultId,
        assessmentId,
        userId: assessment.userId,
        compoundType: "CATABOLIC_CASCADE",
        severity: catabolicFlags.length >= 5 ? "URGENT" : "CONCERN",
        triggeringAxes: [...new Set(catabolicFlags.map((r) => r.axis).filter(Boolean))] as any,
        triggeringQuestions: catabolicFlags.map((r) => r.questionId),
        flagCount: catabolicFlags.length,
        clinicalNote: `${catabolicFlags.length} catabolic risk factors identified. Catabolic crisis intervention window is 14–28 days. Accelerated muscle loss likely without immediate action.`,
        scoreBoostApplied: catabolicFlags.length * 2,
        recommendedAction: "Catabolic Crisis Recovery Protocol — immediate protein loading, resistance training, medical evaluation",
        urgentReferral: catabolicFlags.length >= 5,
        detectedAt: now,
      });
      flagIds.push(flagId);
    }
    // Update result with compound risk flag IDs
    if (flagIds.length > 0) {
      await ctx.db.patch(resultId, {
        compoundRisksDetected: flagIds,
        hasCompoundRisk: true,
      });
    }
    // ── Update assessment status → SCORED ──
    await ctx.db.patch(assessmentId, {
      status: "SCORED",
      scoredAt: now,
      updatedAt: now,
    });
    // ── Update user's denormalized risk tier snapshot ──
    await ctx.db.patch(assessment.userId, {
      latestRiskTier: riskTier,
      latestAssessmentType: assessmentType,
      latestAssessmentAt: now,
      updatedAt: now,
    });
    return resultId;
  },
});
/**
 * captureEmailLead
 * Called when user submits email to unlock PDF report.
 * Creates emailLead record → triggers ConvertKit sync.
 */
export const captureEmailLead = mutation({
  args: {
    email: v.string(),
    firstName: v.optional(v.string()),
    resultId: v.id("results"),
    assessmentId: v.id("assessments"),
    userId: v.optional(v.id("users")),
    source: v.optional(v.string()),
    utmSource: v.optional(v.string()),
    utmCampaign: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { email, firstName, resultId, assessmentId, userId, source, utmSource, utmCampaign } = args;
    const now = Date.now();
    // Load result for risk tier tagging
    const result = await ctx.db.get(resultId);
    if (!result) throw new Error("Result not found");
    // Check for existing lead with same email
    const existing = await ctx.db
      .query("emailLeads")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();
    if (existing) return existing._id;
    // ConvertKit tags — drives email sequence selection
    const convertKitTags = [
      "assessment-complete",
      `risk-${result.riskTier}`,
      `type-${result.assessmentType}`,
    ];
    const leadId = await ctx.db.insert("emailLeads", {
      userId,
      assessmentId,
      resultId,
      email,
      firstName,
      assessmentType: result.assessmentType,
      riskTier: result.riskTier,
      totalScore: result.totalScore,
      convertKitStatus: "PENDING",
      convertKitTags,
      pdfStatus: "NOT_GENERATED",
      source,
      utmSource,
      utmCampaign,
      capturedAt: now,
      updatedAt: now,
    });
    return leadId;
  },
});
