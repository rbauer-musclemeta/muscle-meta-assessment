/**
 * MUSCLE-META MATRIX — CONVEX DATABASE SCHEMA
 * ============================================
 * Single-file, paste-ready for /convex/schema.ts
 *
 * Architecture: Polymorphic Multi-Assessment Platform Engine
 * Supports: GMMBB Axis (46Q), CRA (30Q), GLP-1, Pickleball,
 *           Post-Hospital, CCRAF (95Q), MFAT, Bone Health,
 *           Brain-Muscle, Catabolic Crisis — and any future type.
 *
 * Auth:     Clerk (clerkUserId is the foreign key throughout)
 * Realtime: Convex reactive queries — no polling needed
 * Email:    ConvertKit gate built into emailLeads table
 * PDF:      Tracked in pdfReports table, gated behind emailLeads
 *
 * Tables (12):
 *   users              — Clerk-synced user profiles
 *   assessmentConfigs  — Blueprint for each assessment type/version
 *   assessments        — One per user per attempt
 *   responses          — One per question per assessment
 *   results            — Computed scores, flags, action plan
 *   compoundRiskFlags  — Osteosarcopenia, GLP-1, early-window, etc.
 *   courses            — Course catalog
 *   courseEnrollments  — User ↔ course progress
 *   resources          — Blog posts, tools, guides, worksheets
 *   recommendations    — Personalization router output
 *   emailLeads         — ConvertKit gate + tagging
 *   pdfReports         — Generated report tracking
 *
 * Randy Bauer PT — Muscle-Meta Matrix™
 * Version: 1.0.0 | March 2026
 */

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// ─────────────────────────────────────────────
// SHARED VALIDATORS (reused across tables)
// ─────────────────────────────────────────────

/** All assessment types the platform supports */
const assessmentTypeValidator = v.union(
  v.literal("GMMBB"),          // 46Q — Primary GMMBB Axis assessment
  v.literal("CRA"),            // 30Q — Catabolic Risk Assessment (lead magnet)
  v.literal("4P_MMA"),         // 60Q — 4 Pillar full assessment (paid upgrade)
  v.literal("GLP1"),           // GLP-1 Muscle Protection
  v.literal("PICKLEBALL"),     // Pickleball Readiness (50+)
  v.literal("POST_HOSPITAL"),  // Post-hospitalization recovery
  v.literal("CCRAF"),          // 95Q — Comprehensive Catabolic Risk (clinical)
  v.literal("MFAT"),           // Mitochondrial Function Assessment
  v.literal("BONE_HEALTH"),    // Osteosarcopenia screening
  v.literal("BRAIN_MUSCLE"),   // Neuromuscular health
  v.literal("CATABOLIC_CRISIS") // Post-surgery/illness recovery
);

/** Universal 5-tier risk classification */
const riskTierValidator = v.union(
  v.literal("MINIMAL"),   // 0–20%  — Annual monitoring, maintenance
  v.literal("LOW"),       // 21–40% — Semi-annual check-ins, prevention
  v.literal("MODERATE"),  // 41–60% — Quarterly monitoring, intervention
  v.literal("HIGH"),      // 61–80% — Monthly monitoring, intensive support
  v.literal("CRITICAL")   // 81–100% — Weekly, urgent medical evaluation
);

/** GMMBB Axis — 5 weighted axes */
const gmmbbAxisValidator = v.union(
  v.literal("BONE"),       // 25% weight — leads muscle loss by 7–14 days
  v.literal("MUSCLE"),     // 25% weight — primary sarcopenia axis
  v.literal("METABOLIC"),  // 20% weight — metabolic flexibility, insulin
  v.literal("GUT"),        // 15% weight — microbiome, absorption
  v.literal("BRAIN")       // 15% weight — cognitive, neuromuscular, mood
);

/** The 12 categories spanning all 4 pillars */
const categoryValidator = v.union(
  // Pillar 1 — Exercise & Mobility
  v.literal("JOINT_HEALTH"),
  v.literal("FUNCTIONAL_INDEPENDENCE"),
  v.literal("MOBILITY"),
  v.literal("ENDURANCE"),
  v.literal("STRENGTH"),
  // Pillar 2 — Nutrition & Metabolism
  v.literal("NUTRITION"),
  v.literal("METABOLIC_FLEXIBILITY"),
  // Pillar 3 — Recovery & Stress
  v.literal("RECOVERY"),
  v.literal("LIFESTYLE"),
  v.literal("STRESS_MANAGEMENT"),
  // Pillar 4 — Balance & Brain Health
  v.literal("BALANCE"),
  v.literal("BRAIN_HEALTH")
);

/** Compound risk types — the platform's clinical differentiators */
const compoundRiskTypeValidator = v.union(
  v.literal("OSTEOSARCOPENIA"),          // Bone + Muscle both elevated (58% of hip fx)
  v.literal("GLP1_UNPROTECTED_LOSS"),    // GLP-1 user + low muscle score
  v.literal("EARLY_BONE_WINDOW"),        // Bone loss preceding muscle (7–14 day window)
  v.literal("CATABOLIC_CASCADE"),        // 3+ YES flags within single axis
  v.literal("MULTI_AXIS_COMPOUND"),      // High risk across 3+ axes simultaneously
  v.literal("LEUCINE_DEFICIT_RISK"),     // Protein intake below 2.5g leucine threshold
  v.literal("POST_SURGICAL_ACCELERATED") // Surgery + age 65+ + low baseline muscle
);

/** Resource/content content types */
const resourceTypeValidator = v.union(
  v.literal("BLOG_POST"),
  v.literal("COURSE"),
  v.literal("TOOL"),
  v.literal("WORKSHEET"),
  v.literal("VIDEO"),
  v.literal("GUIDE"),
  v.literal("CALCULATOR"),
  v.literal("CHECKLIST"),
  v.literal("WEBINAR")
);

/** Pillar tags */
const pillarValidator = v.union(
  v.literal("EXERCISE_MOBILITY"),
  v.literal("NUTRITION_METABOLISM"),
  v.literal("RECOVERY_STRESS"),
  v.literal("BALANCE_BRAIN")
);

// ─────────────────────────────────────────────
// SCHEMA DEFINITION
// ─────────────────────────────────────────────

export default defineSchema({

  // ──────────────────────────────────────────
  // TABLE 1: users
  // Synced from Clerk via webhook on sign-up/update.
  // clerkUserId is the join key to everything.
  // ──────────────────────────────────────────
  users: defineTable({
    // Clerk identity
    clerkUserId:    v.string(),   // e.g. "user_2abc123..."
    email:          v.string(),
    firstName:      v.optional(v.string()),
    lastName:       v.optional(v.string()),

    // Onboarding profile — collected pre-assessment
    age:            v.optional(v.number()),
    sex:            v.optional(v.union(v.literal("MALE"), v.literal("FEMALE"), v.literal("OTHER"))),
    heightCm:       v.optional(v.number()),
    weightKg:       v.optional(v.number()),
    primaryGoal:    v.optional(v.string()),   // "rebuild", "optimize", "prevent", "perform"

    // Population flags — drive assessment routing
    isGLP1User:         v.optional(v.boolean()),  // Ozempic, Wegovy, etc.
    isPostSurgical:     v.optional(v.boolean()),
    isPostHospital:     v.optional(v.boolean()),
    isPickleballPlayer: v.optional(v.boolean()),
    isHealthcarePro:    v.optional(v.boolean()),  // unlocks CCRAF

    // Platform status
    role:           v.union(v.literal("USER"), v.literal("ADMIN"), v.literal("CLINICIAN")),
    tier:           v.union(
                      v.literal("FREE"),         // CRA only
                      v.literal("FOUNDING"),     // Founding cohort ($47/mo)
                      v.literal("PRO"),          // Full platform
                      v.literal("CLINICAL")      // Provider access
                    ),
    isActive:       v.boolean(),
    onboardedAt:    v.optional(v.number()),  // Unix ms

    // Snapshot of latest assessment — denormalized for fast dashboard loads
    latestRiskTier:       v.optional(riskTierValidator),
    latestAssessmentType: v.optional(assessmentTypeValidator),
    latestAssessmentAt:   v.optional(v.number()),

    // ConvertKit sync
    convertKitSubscriberId: v.optional(v.string()),
    emailCapturedAt:        v.optional(v.number()),

    createdAt: v.number(),  // Unix ms
    updatedAt: v.number(),
  })
    .index("by_clerk_id",  ["clerkUserId"])
    .index("by_email",     ["email"])
    .index("by_risk_tier", ["latestRiskTier"])
    .index("by_tier",      ["tier"]),


  // ──────────────────────────────────────────
  // TABLE 2: assessmentConfigs
  // Blueprint for each assessment type + version.
  // Questions are stored as JSON here — loaded at
  // runtime to render the assessment UI.
  // One config per (assessmentType + version) pair.
  // ──────────────────────────────────────────
  assessmentConfigs: defineTable({
    assessmentType: assessmentTypeValidator,
    version:        v.string(),      // "1.0", "1.1", etc. — semver
    isActive:       v.boolean(),     // only one active per type
    isPublic:       v.boolean(),     // false = clinical/admin only

    // Display
    title:          v.string(),      // "GMMBB Axis Assessment"
    subtitle:       v.optional(v.string()),
    description:    v.string(),
    estimatedMins:  v.number(),      // 8, 20, 60, etc.
    totalQuestions: v.number(),      // 30, 46, 60, 95

    // Funnel positioning
    funnelTier:     v.union(
                      v.literal("LEAD_MAGNET"),  // Free, no auth required
                      v.literal("FREEMIUM"),     // Free with email gate
                      v.literal("PAID"),         // Requires subscription
                      v.literal("CLINICAL")      // Provider-administered
                    ),

    // Scoring configuration — drives the engine
    scoringConfig: v.object({
      maxScore:      v.number(),     // 400 for GMMBB, varies by type
      scoringModel:  v.union(
                       v.literal("GMMBB_WEIGHTED"),   // Bone 25% Muscle 25% Meta 20% Gut 15% Brain 15%
                       v.literal("CRA_SECTIONAL"),    // Section-based, equal weights
                       v.literal("SIMPLE_SUM"),       // Direct sum, no weighting
                       v.literal("CLINICAL_COMPOSITE") // Multi-factor clinical model
                     ),

      // GMMBB-specific axis weights (null for non-GMMBB types)
      axisWeights: v.optional(v.object({
        BONE:      v.number(),   // 0.25
        MUSCLE:    v.number(),   // 0.25
        METABOLIC: v.number(),   // 0.20
        GUT:       v.number(),   // 0.15
        BRAIN:     v.number(),   // 0.15
      })),

      // Risk tier thresholds (as % of maxScore)
      riskThresholds: v.object({
        MINIMAL:  v.number(),  // 0
        LOW:      v.number(),  // 21
        MODERATE: v.number(),  // 41
        HIGH:     v.number(),  // 61
        CRITICAL: v.number(),  // 81
      }),

      // Compound risk rules — which combos to detect
      compoundRiskRules: v.array(v.object({
        ruleId:          v.string(),
        compoundType:    compoundRiskTypeValidator,
        triggerLogic:    v.string(),  // human-readable: "BONE >= HIGH && MUSCLE >= HIGH"
        flagThreshold:   v.number(),  // min YES flags within an axis to trigger cascade
        severityBoost:   v.number(),  // points added to total when compound detected
      })),

      // Protective factor offsets (reduce risk score)
      protectiveFactors: v.array(v.object({
        factorId:       v.string(),
        description:    v.string(),   // "Daily creatine supplementation"
        scoreReduction: v.number(),   // -3, -5, -8
      })),
    }),

    // The actual question bank — full JSON config
    // Structure matches existing qmma-assessment-preview.jsx
    questions: v.array(v.object({
      id:          v.string(),         // "cc_01", "gm_12", etc.
      screenIndex: v.number(),         // 0–6 for GMMBB's 7 screens
      axis:        v.optional(gmmbbAxisValidator),
      category:    v.optional(categoryValidator),
      pillar:      v.optional(pillarValidator),

      text:        v.string(),
      description: v.optional(v.string()),

      // Response format
      questionType: v.union(
        v.literal("SINGLE_SELECT"),
        v.literal("MULTI_SELECT"),
        v.literal("NUMERIC"),
        v.literal("BOOLEAN"),
        v.literal("SARC_F")          // Validated SARC-F sarcopenia screen
      ),

      options: v.optional(v.array(v.object({
        value:       v.union(v.number(), v.string()),
        label:       v.string(),
        description: v.optional(v.string()),
        score:       v.number(),     // Points this option contributes
      }))),

      // Numeric range (for NUMERIC type)
      numericMin:  v.optional(v.number()),
      numericMax:  v.optional(v.number()),
      numericUnit: v.optional(v.string()),  // "kg", "years", "servings/day"

      // Conditional display logic
      showIf: v.optional(v.object({
        questionId: v.string(),
        operator:   v.union(v.literal("equals"), v.literal("gte"), v.literal("lte"), v.literal("includes")),
        value:      v.union(v.string(), v.number()),
      })),

      // Clinical flags
      isCatabolicRiskFactor:  v.optional(v.boolean()),
      catabolicMultiplier:    v.optional(v.number()),  // 2.0, 1.8, 1.7...
      isCompoundRiskTrigger:  v.optional(v.boolean()),
      requiresMedicalClearance: v.optional(v.boolean()),

      // Gender-specific routing
      sexSpecific: v.optional(v.union(v.literal("MALE"), v.literal("FEMALE"))),
    })),

    // Screen metadata (for GMMBB 7-screen flow)
    screens: v.optional(v.array(v.object({
      index:       v.number(),
      title:       v.string(),       // "Gut Health", "Muscle & Strength", etc.
      description: v.optional(v.string()),
      axis:        v.optional(gmmbbAxisValidator),
      questionIds: v.array(v.string()),
    }))),

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_type",            ["assessmentType"])
    .index("by_type_version",    ["assessmentType", "version"])
    .index("by_type_active",     ["assessmentType", "isActive"])
    .index("by_funnel_tier",     ["funnelTier"]),


  // ──────────────────────────────────────────
  // TABLE 3: assessments
  // One record per user per attempt.
  // Polymorphic: assessmentType drives scoring.
  // Status machine: STARTED → IN_PROGRESS → SUBMITTED → SCORED
  // ──────────────────────────────────────────
  assessments: defineTable({
    userId:           v.id("users"),
    clerkUserId:      v.string(),       // denormalized for fast lookup
    configId:         v.id("assessmentConfigs"),
    assessmentType:   assessmentTypeValidator,
    configVersion:    v.string(),

    // Status machine
    status: v.union(
      v.literal("STARTED"),      // record created, first question not yet answered
      v.literal("IN_PROGRESS"),  // partial responses saved
      v.literal("SUBMITTED"),    // all questions answered, scoring pending
      v.literal("SCORED"),       // results computed and stored
      v.literal("ABANDONED")     // >30 days inactive
    ),

    // Progress tracking (for resume flow)
    currentScreenIndex:    v.optional(v.number()),   // 0–6 for GMMBB
    lastQuestionId:        v.optional(v.string()),
    questionsAnswered:     v.number(),
    totalQuestions:        v.number(),
    percentComplete:       v.number(),               // 0–100

    // Context captured at assessment start — affects scoring
    contextSnapshot: v.optional(v.object({
      age:            v.optional(v.number()),
      sex:            v.optional(v.string()),
      isGLP1User:     v.optional(v.boolean()),
      isPostSurgical: v.optional(v.boolean()),
      weightKg:       v.optional(v.number()),
    })),

    // Entry point — for attribution
    entrySource: v.optional(v.union(
      v.literal("WEBSITE_CTA"),
      v.literal("EMAIL_LINK"),
      v.literal("WORKSHOP_QR"),
      v.literal("DIRECT"),
      v.literal("ADMIN_INVITE"),
      v.literal("REFERRAL")
    )),
    utmSource:   v.optional(v.string()),
    utmCampaign: v.optional(v.string()),

    // Timestamps
    startedAt:   v.number(),
    updatedAt:   v.number(),
    submittedAt: v.optional(v.number()),
    scoredAt:    v.optional(v.number()),

    // Reassessment tracking
    isReassessment:    v.boolean(),
    previousAssessmentId: v.optional(v.id("assessments")),
    reassessmentNumber:   v.number(),  // 0 = baseline, 1 = first follow-up, etc.
  })
    .index("by_user",              ["userId"])
    .index("by_clerk_user",        ["clerkUserId"])
    .index("by_type",              ["assessmentType"])
    .index("by_status",            ["status"])
    .index("by_user_type",         ["userId", "assessmentType"])
    .index("by_user_status",       ["userId", "status"])
    .index("by_type_status",       ["assessmentType", "status"]),


  // ──────────────────────────────────────────
  // TABLE 4: responses
  // One record per question per assessment.
  // Auto-saved on every answer — enables resume.
  // ──────────────────────────────────────────
  responses: defineTable({
    assessmentId: v.id("assessments"),
    userId:       v.id("users"),
    questionId:   v.string(),          // matches assessmentConfigs.questions[].id

    // Classification (denormalized from question config for fast scoring)
    axis:     v.optional(gmmbbAxisValidator),
    category: v.optional(categoryValidator),
    pillar:   v.optional(pillarValidator),

    // The answer
    responseType: v.union(
      v.literal("SINGLE"),
      v.literal("MULTI"),
      v.literal("NUMERIC"),
      v.literal("BOOLEAN")
    ),
    valueString:  v.optional(v.string()),   // for SINGLE_SELECT
    valueArray:   v.optional(v.array(v.string())), // for MULTI_SELECT
    valueNumber:  v.optional(v.number()),   // for NUMERIC
    valueBoolean: v.optional(v.boolean()),  // for BOOLEAN

    // Computed at save time
    rawScore:           v.number(),         // direct option score
    weightedScore:      v.optional(v.number()), // after axis weight applied
    isCatabolicFlag:    v.boolean(),        // triggers compound risk check
    isCompoundTrigger:  v.boolean(),

    // Ordering
    screenIndex:  v.number(),
    questionOrder: v.number(),

    answeredAt: v.number(),
    updatedAt:  v.number(),
  })
    .index("by_assessment",          ["assessmentId"])
    .index("by_user",                ["userId"])
    .index("by_assessment_question", ["assessmentId", "questionId"])
    .index("by_assessment_axis",     ["assessmentId", "axis"])
    .index("by_catabolic_flags",     ["assessmentId", "isCatabolicFlag"]),


  // ──────────────────────────────────────────
  // TABLE 5: results
  // Computed after submission. One per assessment.
  // The output of the scoring engine.
  // Drives: dashboard display, PDF report, email tags,
  //         recommendations, compound risk detection.
  // ──────────────────────────────────────────
  results: defineTable({
    assessmentId:   v.id("assessments"),
    userId:         v.id("users"),
    clerkUserId:    v.string(),
    assessmentType: assessmentTypeValidator,

    // ── Core scores ──
    totalScore:    v.number(),   // raw sum before weighting
    maxScore:      v.number(),   // from config (e.g. 400 for GMMBB)
    percentScore:  v.number(),   // 0–100
    riskTier:      riskTierValidator,

    // ── GMMBB Axis scores (populated for GMMBB type) ──
    axisScores: v.optional(v.object({
      BONE:      v.optional(v.object({
        rawScore:      v.number(),
        weightedScore: v.number(),
        percentile:    v.number(),
        riskTier:      riskTierValidator,
        questionCount: v.number(),
      })),
      MUSCLE:    v.optional(v.object({
        rawScore:      v.number(),
        weightedScore: v.number(),
        percentile:    v.number(),
        riskTier:      riskTierValidator,
        questionCount: v.number(),
      })),
      METABOLIC: v.optional(v.object({
        rawScore:      v.number(),
        weightedScore: v.number(),
        percentile:    v.number(),
        riskTier:      riskTierValidator,
        questionCount: v.number(),
      })),
      GUT:       v.optional(v.object({
        rawScore:      v.number(),
        weightedScore: v.number(),
        percentile:    v.number(),
        riskTier:      riskTierValidator,
        questionCount: v.number(),
      })),
      BRAIN:     v.optional(v.object({
        rawScore:      v.number(),
        weightedScore: v.number(),
        percentile:    v.number(),
        riskTier:      riskTierValidator,
        questionCount: v.number(),
      })),
    })),

    // ── CRA / 4P-MMA section scores (populated for non-GMMBB types) ──
    sectionScores: v.optional(v.array(v.object({
      sectionId:    v.string(),
      sectionName:  v.string(),
      rawScore:     v.number(),
      maxScore:     v.number(),
      percentScore: v.number(),
      riskTier:     riskTierValidator,
    }))),

    // ── 12-category breakdown ──
    categoryScores: v.optional(v.array(v.object({
      category:    categoryValidator,
      pillar:      pillarValidator,
      rawScore:    v.number(),
      percentScore: v.number(),
      riskTier:    riskTierValidator,
    }))),

    // ── Compound risk flags detected ──
    compoundRisksDetected: v.array(v.id("compoundRiskFlags")),
    hasCompoundRisk:       v.boolean(),  // denormalized for fast filter

    // ── Protective factors applied ──
    protectiveFactorsApplied: v.array(v.object({
      factorId:       v.string(),
      description:    v.string(),
      scoreReduction: v.number(),
    })),
    adjustedScore: v.number(),   // totalScore minus protective factor reductions

    // ── Personalized action plan ──
    // Generated by action-plan engine from risk tier + axis scores
    actionPlan: v.object({
      headline:       v.string(),   // "Your Most Urgent Priority"
      topPriorities:  v.array(v.object({
        rank:         v.number(),   // 1, 2, 3
        axis:         v.optional(gmmbbAxisValidator),
        category:     v.optional(categoryValidator),
        title:        v.string(),
        description:  v.string(),
        urgency:      v.union(v.literal("IMMEDIATE"), v.literal("THIS_WEEK"), v.literal("THIS_MONTH")),
      })),

      // Clinical referral recommendations
      referrals: v.array(v.object({
        specialty:  v.string(),     // "Physical Therapist", "Registered Dietitian"
        urgency:    v.union(v.literal("URGENT"), v.literal("SOON"), v.literal("ROUTINE")),
        reason:     v.string(),
      })),

      // Nutrition prescriptions
      nutritionPrescription: v.optional(v.object({
        dailyProteinGrams:     v.number(),
        proteinPerMealGrams:   v.number(),
        leucineThresholdMet:   v.boolean(),  // 2.5–3.0g per meal
        creatineRecommended:   v.boolean(),
        hmb_recommended:       v.boolean(),
        priorityFoods:         v.array(v.string()),
      })),

      // Exercise prescription
      exercisePrescription: v.optional(v.object({
        weeklyFrequency:    v.number(),
        sessionDurationMin: v.number(),
        primaryFocus:       v.string(),
        vilpaIntegration:   v.boolean(),  // MetaBurst™ VILPA protocol
        progressionPhase:   v.union(
          v.literal("FOUNDATION"),
          v.literal("BUILDING"),
          v.literal("OPTIMIZATION"),
          v.literal("MASTERY")
        ),
      })),

      // Recovery protocols
      recoveryProtocol: v.optional(v.object({
        sleepTargetHours:  v.number(),
        stressProtocol:    v.string(),
        monitoringFreq:    v.union(v.literal("DAILY"), v.literal("WEEKLY"), v.literal("BIWEEKLY"), v.literal("MONTHLY")),
      })),
    }),

    // ── Score change from previous (if reassessment) ──
    scoreChange: v.optional(v.object({
      previousScore:     v.number(),
      previousRiskTier:  riskTierValidator,
      scoreDelta:        v.number(),    // positive = improvement
      percentImprovement: v.number(),
      tierChanged:       v.boolean(),
      weeksSinceBaseline: v.number(),
    })),

    computedAt: v.number(),
  })
    .index("by_assessment",      ["assessmentId"])
    .index("by_user",            ["userId"])
    .index("by_clerk_user",      ["clerkUserId"])
    .index("by_risk_tier",       ["riskTier"])
    .index("by_compound_risk",   ["hasCompoundRisk"])
    .index("by_type_risk",       ["assessmentType", "riskTier"]),


  // ──────────────────────────────────────────
  // TABLE 6: compoundRiskFlags
  // Detected compound risks per result.
  // These are the platform's clinical differentiators:
  // — Osteosarcopenia (bone + muscle, 58% of hip fx)
  // — GLP-1 unprotected muscle loss
  // — Early bone-before-muscle window (7–14 days)
  // ──────────────────────────────────────────
  compoundRiskFlags: defineTable({
    resultId:       v.id("results"),
    assessmentId:   v.id("assessments"),
    userId:         v.id("users"),

    compoundType:   compoundRiskTypeValidator,
    severity:       v.union(v.literal("WATCH"), v.literal("CONCERN"), v.literal("URGENT")),

    // What triggered this flag
    triggeringAxes:      v.array(gmmbbAxisValidator),
    triggeringQuestions: v.array(v.string()),  // questionIds
    flagCount:           v.number(),           // how many YES flags triggered it

    // Clinical context
    clinicalNote:        v.string(),    // e.g. "Bone axis precedes muscle by 7–14 days"
    evidenceBasis:       v.optional(v.string()),  // study reference
    scoreBoostApplied:   v.number(),    // additional points added to total

    // Recommended action
    recommendedAction:   v.string(),
    urgentReferral:      v.boolean(),

    detectedAt: v.number(),
  })
    .index("by_result",       ["resultId"])
    .index("by_user",         ["userId"])
    .index("by_compound_type", ["compoundType"])
    .index("by_severity",     ["severity"]),


  // ──────────────────────────────────────────
  // TABLE 7: courses
  // Course catalog. Linked to assessments via
  // recommendations table.
  // ──────────────────────────────────────────
  courses: defineTable({
    // Identity
    slug:        v.string(),    // "rebuild-protocol", "mito-recharge-4week"
    title:       v.string(),
    subtitle:    v.optional(v.string()),
    description: v.string(),

    // Classification
    courseType: v.union(
      v.literal("FLAGSHIP"),       // Rebuild Protocol: Catabolic Crisis Intervention
      v.literal("FOUNDATION"),     // Entry-level, universal
      v.literal("SPECIALTY"),      // Population-specific (GLP-1, Pickleball, etc.)
      v.literal("MINI"),           // 1–3 lessons, quick win
      v.literal("DEEP_DIVE")       // Advanced, 6+ weeks
    ),

    // Pillar / axis targeting
    primaryPillar:  v.optional(pillarValidator),
    targetAxes:     v.optional(v.array(gmmbbAxisValidator)),
    targetCategories: v.optional(v.array(categoryValidator)),

    // Risk tier targeting — who this course is for
    targetRiskTiers: v.array(riskTierValidator),

    // Population tags
    populationTags: v.array(v.string()),  // ["glp1", "post-surgical", "65+", "pickleball"]

    // Structure
    weekCount:    v.number(),
    moduleCount:  v.number(),
    lessonCount:  v.number(),
    estimatedHrsTotal: v.number(),

    // Pricing
    accessTier: v.union(
      v.literal("FREE"),
      v.literal("EMAIL_GATE"),   // free after email capture
      v.literal("FOUNDING"),     // founding cohort only
      v.literal("SUBSCRIPTION"), // requires active plan
      v.literal("ONE_TIME")      // individual purchase
    ),
    priceUsd:    v.optional(v.number()),

    // Content status
    status: v.union(
      v.literal("DRAFT"),
      v.literal("IN_DEVELOPMENT"),
      v.literal("BETA"),         // founding cohort only
      v.literal("LIVE"),
      v.literal("ARCHIVED")
    ),

    // SEO / marketing
    hook:           v.optional(v.string()),  // one-liner marketing hook
    outcomes:       v.optional(v.array(v.string())),  // "Rebuild 3–5% muscle in 6 weeks"
    prerequisites:  v.optional(v.array(v.string())),

    // Asset tracking (links to Asset Command Center)
    assetCommandCenterId: v.optional(v.string()),

    isActive:    v.boolean(),
    createdAt:   v.number(),
    updatedAt:   v.number(),
  })
    .index("by_slug",       ["slug"])
    .index("by_type",       ["courseType"])
    .index("by_status",     ["status"])
    .index("by_access",     ["accessTier"])
    .index("by_active",     ["isActive"]),


  // ──────────────────────────────────────────
  // TABLE 8: courseEnrollments
  // User ↔ course progress tracking.
  // ──────────────────────────────────────────
  courseEnrollments: defineTable({
    userId:   v.id("users"),
    courseId: v.id("courses"),

    enrolledAt:    v.number(),
    startedAt:     v.optional(v.number()),
    completedAt:   v.optional(v.number()),

    status: v.union(
      v.literal("ENROLLED"),
      v.literal("IN_PROGRESS"),
      v.literal("COMPLETED"),
      v.literal("PAUSED"),
      v.literal("DROPPED")
    ),

    // Granular progress
    lessonsCompleted:  v.number(),
    totalLessons:      v.number(),
    percentComplete:   v.number(),
    currentLesson:     v.optional(v.string()),  // lesson slug
    lastActivityAt:    v.optional(v.number()),

    // Engagement
    moduleCompletions: v.optional(v.array(v.object({
      moduleId:     v.string(),
      completedAt:  v.number(),
    }))),

    // Outcome
    preAssessmentId:  v.optional(v.id("assessments")),  // assessment taken before course
    postAssessmentId: v.optional(v.id("assessments")),  // reassessment after course
    outcomeNotes:     v.optional(v.string()),            // Randy's notes

    // Attribution
    enrollmentSource: v.optional(v.string()),   // "recommendation", "direct", "email"
    recommendationId: v.optional(v.id("recommendations")),
  })
    .index("by_user",         ["userId"])
    .index("by_course",       ["courseId"])
    .index("by_user_course",  ["userId", "courseId"])
    .index("by_status",       ["status"]),


  // ──────────────────────────────────────────
  // TABLE 9: resources
  // Blog posts, tools, guides, calculators.
  // Linked to users via recommendations table.
  // ──────────────────────────────────────────
  resources: defineTable({
    slug:        v.string(),
    title:       v.string(),
    description: v.string(),
    resourceType: resourceTypeValidator,

    // Content targeting
    targetRiskTiers:  v.array(riskTierValidator),
    targetAxes:       v.optional(v.array(gmmbbAxisValidator)),
    targetCategories: v.optional(v.array(categoryValidator)),
    primaryPillar:    v.optional(pillarValidator),
    populationTags:   v.array(v.string()),

    // Access control
    accessTier: v.union(
      v.literal("FREE"),
      v.literal("EMAIL_GATE"),
      v.literal("SUBSCRIPTION"),
      v.literal("CLINICAL")
    ),

    // External URL or internal path
    url:          v.optional(v.string()),
    internalPath: v.optional(v.string()),
    isPdf:        v.boolean(),

    // Asset Command Center
    assetCommandCenterId: v.optional(v.string()),
    contentPillar:        v.optional(v.string()),  // for content multiplication tracking

    isActive:   v.boolean(),
    publishedAt: v.optional(v.number()),
    createdAt:  v.number(),
    updatedAt:  v.number(),
  })
    .index("by_slug",      ["slug"])
    .index("by_type",      ["resourceType"])
    .index("by_pillar",    ["primaryPillar"])
    .index("by_active",    ["isActive"]),


  // ──────────────────────────────────────────
  // TABLE 10: recommendations
  // Personalization Router output.
  // Generated from result → matched to courses/resources.
  // This is the long-term moat: configurable engine,
  // not hardcoded if/else.
  // ──────────────────────────────────────────
  recommendations: defineTable({
    userId:       v.id("users"),
    resultId:     v.id("results"),
    assessmentId: v.id("assessments"),

    generatedAt:  v.number(),
    expiresAt:    v.optional(v.number()),  // null = permanent

    // Ordered recommendations (rank 1 = highest priority)
    courses: v.array(v.object({
      rank:        v.number(),
      courseId:    v.id("courses"),
      matchReason: v.string(),   // "Bone axis HIGH + osteosarcopenia flag"
      urgency:     v.union(v.literal("IMMEDIATE"), v.literal("SOON"), v.literal("WHEN_READY")),
      isViewed:    v.boolean(),
      isEnrolled:  v.boolean(),
      viewedAt:    v.optional(v.number()),
      enrolledAt:  v.optional(v.number()),
    })),

    resources: v.array(v.object({
      rank:         v.number(),
      resourceId:   v.id("resources"),
      matchReason:  v.string(),
      isViewed:     v.boolean(),
      viewedAt:     v.optional(v.number()),
    })),

    // Meta
    engineVersion:  v.string(),   // "1.0" — for A/B testing iterations
    isActive:       v.boolean(),  // superseded by newer recommendation set
  })
    .index("by_user",       ["userId"])
    .index("by_result",     ["resultId"])
    .index("by_user_active", ["userId", "isActive"]),


  // ──────────────────────────────────────────
  // TABLE 11: emailLeads
  // ConvertKit gate for PDF reports.
  // Every completed assessment creates a lead record.
  // Email captured here → triggers ConvertKit automation
  // → PDF delivered via email sequence.
  // ──────────────────────────────────────────
  emailLeads: defineTable({
    // Could be a registered user OR anonymous visitor
    userId:       v.optional(v.id("users")),
    assessmentId: v.optional(v.id("assessments")),
    resultId:     v.optional(v.id("results")),

    email:        v.string(),
    firstName:    v.optional(v.string()),

    // What assessment triggered this
    assessmentType: v.optional(assessmentTypeValidator),
    riskTier:       v.optional(riskTierValidator),
    totalScore:     v.optional(v.number()),

    // ConvertKit integration
    convertKitStatus: v.union(
      v.literal("PENDING"),     // captured, not yet sent to CK
      v.literal("SYNCED"),      // successfully added to CK
      v.literal("FAILED"),      // CK API error, needs retry
      v.literal("UNSUBSCRIBED") // user opted out
    ),
    convertKitSubscriberId: v.optional(v.string()),
    convertKitTags: v.array(v.string()),  // ["assessment-complete", "risk-HIGH", "GMMBB"]
    syncedAt:       v.optional(v.number()),
    syncError:      v.optional(v.string()),

    // PDF report status
    pdfStatus: v.union(
      v.literal("NOT_GENERATED"),
      v.literal("GENERATING"),
      v.literal("READY"),
      v.literal("SENT"),
      v.literal("FAILED")
    ),
    pdfGeneratedAt: v.optional(v.number()),
    pdfSentAt:      v.optional(v.number()),

    // Attribution
    source:     v.optional(v.string()),  // "workshop_qr", "website_cta", "email_link"
    utmSource:  v.optional(v.string()),
    utmCampaign: v.optional(v.string()),

    capturedAt: v.number(),
    updatedAt:  v.number(),
  })
    .index("by_email",          ["email"])
    .index("by_user",           ["userId"])
    .index("by_assessment",     ["assessmentId"])
    .index("by_ck_status",      ["convertKitStatus"])
    .index("by_pdf_status",     ["pdfStatus"])
    .index("by_risk_tier",      ["riskTier"]),


  // ──────────────────────────────────────────
  // TABLE 12: pdfReports
  // Generated report tracking.
  // Created after email gate cleared.
  // Stored reference (URL to S3/Convex file storage).
  // ──────────────────────────────────────────
  pdfReports: defineTable({
    userId:       v.optional(v.id("users")),
    emailLeadId:  v.id("emailLeads"),
    resultId:     v.id("results"),
    assessmentId: v.id("assessments"),

    assessmentType: assessmentTypeValidator,
    riskTier:       riskTierValidator,

    // Report content snapshot (for regeneration)
    reportVersion: v.string(),  // "1.0" — bump when template changes
    contentHash:   v.optional(v.string()),  // MD5 of content for dedup

    // File storage
    storageId:    v.optional(v.id("_storage")),  // Convex file storage
    downloadUrl:  v.optional(v.string()),
    fileSizeBytes: v.optional(v.number()),

    status: v.union(
      v.literal("QUEUED"),
      v.literal("GENERATING"),
      v.literal("READY"),
      v.literal("DELIVERED"),
      v.literal("FAILED"),
      v.literal("EXPIRED")      // download link TTL exceeded
    ),
    generationError: v.optional(v.string()),

    // Delivery
    deliveredVia:  v.optional(v.union(v.literal("EMAIL"), v.literal("DIRECT_DOWNLOAD"))),
    deliveredAt:   v.optional(v.number()),
    downloadCount: v.number(),
    lastDownloadAt: v.optional(v.number()),

    // TTL for download link (default 7 days)
    expiresAt: v.optional(v.number()),

    queuedAt:    v.number(),
    generatedAt: v.optional(v.number()),
  })
    .index("by_email_lead",   ["emailLeadId"])
    .index("by_result",       ["resultId"])
    .index("by_user",         ["userId"])
    .index("by_status",       ["status"])
    .index("by_risk_tier",    ["riskTier"]),

});
