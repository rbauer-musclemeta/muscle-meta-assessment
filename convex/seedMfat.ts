import { mutation } from "./_generated/server";

// ─────────────────────────────────────────────────────────────
// MFAT — Mitochondrial Function Assessment Config Seed
// Run once: convex dashboard → Functions → seedMfatConfig → Run
// Idempotent: checks for existing active MFAT config first
// 58 questions | 1,120 pts | 6 domains
// ─────────────────────────────────────────────────────────────

const O20 = [
  { value: 0,  label: "Never",     score: 0  },
  { value: 5,  label: "Rarely",    score: 5  },
  { value: 10, label: "Sometimes", score: 10 },
  { value: 15, label: "Often",     score: 15 },
  { value: 20, label: "Always",    score: 20 },
];

const O18 = [
  { value: 0,  label: "Never",     score: 0  },
  { value: 5,  label: "Rarely",    score: 5  },
  { value: 9,  label: "Sometimes", score: 9  },
  { value: 14, label: "Often",     score: 14 },
  { value: 18, label: "Always",    score: 18 },
];

const QUESTIONS = [
  // ── Domain 1: Energy Production — screenIndex 0, 10q × 20pt = 200 ──
  { id:"ep_01", screenIndex:0, category:"RECOVERY",            pillar:"RECOVERY_STRESS",      questionType:"SINGLE_SELECT", options:O20, text:"How often do you experience persistent fatigue that is not relieved by rest or sleep?" },
  { id:"ep_02", screenIndex:0, category:"RECOVERY",            pillar:"RECOVERY_STRESS",      questionType:"SINGLE_SELECT", options:O20, text:"How often do you feel a significant energy crash in the afternoon or after meals?" },
  { id:"ep_03", screenIndex:0, category:"RECOVERY",            pillar:"RECOVERY_STRESS",      questionType:"SINGLE_SELECT", options:O20, text:"How often do you wake up feeling unrefreshed despite getting adequate hours of sleep?" },
  { id:"ep_04", screenIndex:0, category:"RECOVERY",            pillar:"RECOVERY_STRESS",      questionType:"SINGLE_SELECT", options:O20, text:"How often do you experience muscle weakness during routine daily activities?" },
  { id:"ep_05", screenIndex:0, category:"RECOVERY",            pillar:"RECOVERY_STRESS",      questionType:"SINGLE_SELECT", options:O20, text:"How often do you feel physically exhausted after only minimal physical exertion?" },
  { id:"ep_06", screenIndex:0, category:"RECOVERY",            pillar:"RECOVERY_STRESS",      questionType:"SINGLE_SELECT", options:O20, text:"How often do you experience shortness of breath with light-to-moderate physical activity?" },
  { id:"ep_07", screenIndex:0, category:"RECOVERY",            pillar:"RECOVERY_STRESS",      questionType:"SINGLE_SELECT", options:O20, text:"How often do you have difficulty sustaining energy throughout the entire day?" },
  { id:"ep_08", screenIndex:0, category:"RECOVERY",            pillar:"RECOVERY_STRESS",      questionType:"SINGLE_SELECT", options:O20, text:"How often do you feel that your overall physical endurance has significantly declined?" },
  { id:"ep_09", screenIndex:0, category:"RECOVERY",            pillar:"RECOVERY_STRESS",      questionType:"SINGLE_SELECT", options:O20, text:"How often do you experience heaviness, sluggishness, or deep fatigue in your limbs?" },
  { id:"ep_10", screenIndex:0, category:"RECOVERY",            pillar:"RECOVERY_STRESS",      questionType:"SINGLE_SELECT", options:O20, text:"How often do you feel unable to complete tasks that previously felt effortless or easy?" },
  // ── Domain 2: Oxidative Stress — screenIndex 1, 9q × 20pt = 180 ──
  { id:"os_01", screenIndex:1, category:"RECOVERY",            pillar:"RECOVERY_STRESS",      questionType:"SINGLE_SELECT", options:O20, text:"How often do you experience prolonged muscle soreness or delayed recovery after exercise?" },
  { id:"os_02", screenIndex:1, category:"RECOVERY",            pillar:"RECOVERY_STRESS",      questionType:"SINGLE_SELECT", options:O20, text:"How often do you notice unusually slow recovery from illness, infection, or injury?" },
  { id:"os_03", screenIndex:1, category:"RECOVERY",            pillar:"RECOVERY_STRESS",      questionType:"SINGLE_SELECT", options:O20, text:"How often do you experience premature skin changes, poor wound healing, or reduced skin vitality?" },
  { id:"os_04", screenIndex:1, category:"RECOVERY",            pillar:"RECOVERY_STRESS",      questionType:"SINGLE_SELECT", options:O20, text:"How often do you have persistent joint or muscle inflammation that limits your activity?" },
  { id:"os_05", screenIndex:1, category:"RECOVERY",            pillar:"RECOVERY_STRESS",      questionType:"SINGLE_SELECT", options:O20, text:"How often do you experience sensitivity to environmental toxins, chemicals, or pollutants?" },
  { id:"os_06", screenIndex:1, category:"RECOVERY",            pillar:"RECOVERY_STRESS",      questionType:"SINGLE_SELECT", options:O20, text:"How often do you have unexplained or frequent headaches, migraines, or tension pain?" },
  { id:"os_07", screenIndex:1, category:"RECOVERY",            pillar:"RECOVERY_STRESS",      questionType:"SINGLE_SELECT", options:O20, text:"How often do you experience eye fatigue, light sensitivity, or visual disturbances?" },
  { id:"os_08", screenIndex:1, category:"RECOVERY",            pillar:"RECOVERY_STRESS",      questionType:"SINGLE_SELECT", options:O20, text:"How often do you feel an overall sense of systemic oxidative burnout or cellular stress?" },
  { id:"os_09", screenIndex:1, category:"RECOVERY",            pillar:"RECOVERY_STRESS",      questionType:"SINGLE_SELECT", options:O20, text:"How often do you notice increased susceptibility to oxidative damage (frequent bruising, slow tissue repair)?" },
  // ── Domain 3: Inflammation — screenIndex 2, 10q × 20pt = 200 ──
  { id:"inf_01", screenIndex:2, category:"RECOVERY",           pillar:"RECOVERY_STRESS",      questionType:"SINGLE_SELECT", options:O20, text:"How often do you experience systemic pain, widespread body aches, or generalized discomfort?" },
  { id:"inf_02", screenIndex:2, category:"RECOVERY",           pillar:"RECOVERY_STRESS",      questionType:"SINGLE_SELECT", options:O20, text:"How often do you have joint swelling, stiffness, or morning joint pain?" },
  { id:"inf_03", screenIndex:2, category:"RECOVERY",           pillar:"RECOVERY_STRESS",      questionType:"SINGLE_SELECT", options:O20, text:"How often do you experience digestive inflammation (bloating, cramping, or IBS-like symptoms)?" },
  { id:"inf_04", screenIndex:2, category:"RECOVERY",           pillar:"RECOVERY_STRESS",      questionType:"SINGLE_SELECT", options:O20, text:"How often do you notice skin inflammation, rashes, eczema, or chronic acne?" },
  { id:"inf_05", screenIndex:2, category:"RECOVERY",           pillar:"RECOVERY_STRESS",      questionType:"SINGLE_SELECT", options:O20, text:"How often do you feel a persistent low-grade fever, general warmth, or elevated body temperature?" },
  { id:"inf_06", screenIndex:2, category:"RECOVERY",           pillar:"RECOVERY_STRESS",      questionType:"SINGLE_SELECT", options:O20, text:"How often do you experience brain fog associated with pain or inflammatory flares?" },
  { id:"inf_07", screenIndex:2, category:"RECOVERY",           pillar:"RECOVERY_STRESS",      questionType:"SINGLE_SELECT", options:O20, text:"How often do you have heightened immune reactions, allergic responses, or autoimmune flares?" },
  { id:"inf_08", screenIndex:2, category:"RECOVERY",           pillar:"RECOVERY_STRESS",      questionType:"SINGLE_SELECT", options:O20, text:"How often do you experience chronic sinus congestion, respiratory inflammation, or post-nasal drip?" },
  { id:"inf_09", screenIndex:2, category:"RECOVERY",           pillar:"RECOVERY_STRESS",      questionType:"SINGLE_SELECT", options:O20, text:"How often do you experience delayed recovery from physical exertion that includes systemic inflammation?" },
  { id:"inf_10", screenIndex:2, category:"RECOVERY",           pillar:"RECOVERY_STRESS",      questionType:"SINGLE_SELECT", options:O20, text:"How often do you notice elevated inflammatory markers (CRP, ESR) or systemic inflammation symptoms?" },
  // ── Domain 4: Metabolic Flexibility — screenIndex 3, 9q × 20pt = 180 ──
  { id:"mf_01", screenIndex:3, category:"METABOLIC_FLEXIBILITY", pillar:"NUTRITION_METABOLISM", questionType:"SINGLE_SELECT", options:O20, text:"How often do you experience intense carbohydrate cravings or significant blood sugar crashes?" },
  { id:"mf_02", screenIndex:3, category:"METABOLIC_FLEXIBILITY", pillar:"NUTRITION_METABOLISM", questionType:"SINGLE_SELECT", options:O20, text:"How often do you feel unable to exercise comfortably in a fasted or low-carbohydrate state?" },
  { id:"mf_03", screenIndex:3, category:"METABOLIC_FLEXIBILITY", pillar:"NUTRITION_METABOLISM", questionType:"SINGLE_SELECT", options:O20, text:"How often do you experience significant weight gain despite controlled caloric intake?" },
  { id:"mf_04", screenIndex:3, category:"METABOLIC_FLEXIBILITY", pillar:"NUTRITION_METABOLISM", questionType:"SINGLE_SELECT", options:O20, text:"How often do you feel your body struggles to efficiently use fat as a primary fuel source?" },
  { id:"mf_05", screenIndex:3, category:"METABOLIC_FLEXIBILITY", pillar:"NUTRITION_METABOLISM", questionType:"SINGLE_SELECT", options:O20, text:"How often do you experience blood sugar instability (shakiness, irritability, or anxiety when hungry)?" },
  { id:"mf_06", screenIndex:3, category:"METABOLIC_FLEXIBILITY", pillar:"NUTRITION_METABOLISM", questionType:"SINGLE_SELECT", options:O20, text:"How often do you have difficulty maintaining your weight or body composition despite consistent effort?" },
  { id:"mf_07", screenIndex:3, category:"METABOLIC_FLEXIBILITY", pillar:"NUTRITION_METABOLISM", questionType:"SINGLE_SELECT", options:O20, text:"How often do you feel metabolic sluggishness (low energy, cold extremities, or slow metabolism)?" },
  { id:"mf_08", screenIndex:3, category:"METABOLIC_FLEXIBILITY", pillar:"NUTRITION_METABOLISM", questionType:"SINGLE_SELECT", options:O20, text:"How often do you experience insulin resistance symptoms (difficulty losing weight, intense sugar cravings)?" },
  { id:"mf_09", screenIndex:3, category:"METABOLIC_FLEXIBILITY", pillar:"NUTRITION_METABOLISM", questionType:"SINGLE_SELECT", options:O20, text:"How often do you have trouble transitioning between fuel sources (feeling dependent on frequent carbohydrate intake)?" },
  // ── Domain 5: Recovery Capacity — screenIndex 4, 10q × 18pt = 180 ──
  { id:"rc_01", screenIndex:4, category:"RECOVERY",            pillar:"RECOVERY_STRESS",      questionType:"SINGLE_SELECT", options:O18, text:"How often does your physical performance take more than 48 hours to fully recover after exercise?" },
  { id:"rc_02", screenIndex:4, category:"RECOVERY",            pillar:"RECOVERY_STRESS",      questionType:"SINGLE_SELECT", options:O18, text:"How often do you experience disrupted, fragmented, or poor-quality sleep patterns?" },
  { id:"rc_03", screenIndex:4, category:"RECOVERY",            pillar:"RECOVERY_STRESS",      questionType:"SINGLE_SELECT", options:O18, text:"How often do you feel that your heart rate variability (HRV) is consistently low or declining?" },
  { id:"rc_04", screenIndex:4, category:"STRESS_MANAGEMENT",   pillar:"RECOVERY_STRESS",      questionType:"SINGLE_SELECT", options:O18, text:"How often do you experience elevated perceived stress even with minimal physical exertion?" },
  { id:"rc_05", screenIndex:4, category:"STRESS_MANAGEMENT",   pillar:"RECOVERY_STRESS",      questionType:"SINGLE_SELECT", options:O18, text:"How often do you notice reduced resilience to physical, emotional, or environmental stressors?" },
  { id:"rc_06", screenIndex:4, category:"RECOVERY",            pillar:"RECOVERY_STRESS",      questionType:"SINGLE_SELECT", options:O18, text:"How often do you experience symptoms of adrenal fatigue (exhaustion, salt cravings, or light-headedness)?" },
  { id:"rc_07", screenIndex:4, category:"RECOVERY",            pillar:"RECOVERY_STRESS",      questionType:"SINGLE_SELECT", options:O18, text:"How often do you require more than 9 hours of sleep to feel adequately rested?" },
  { id:"rc_08", screenIndex:4, category:"RECOVERY",            pillar:"RECOVERY_STRESS",      questionType:"SINGLE_SELECT", options:O18, text:"How often does muscle soreness or pain prevent you from maintaining your regular exercise routine?" },
  { id:"rc_09", screenIndex:4, category:"RECOVERY",            pillar:"RECOVERY_STRESS",      questionType:"SINGLE_SELECT", options:O18, text:"How often do you experience burnout cycles (periods of high effort followed by complete physical depletion)?" },
  { id:"rc_10", screenIndex:4, category:"RECOVERY",            pillar:"RECOVERY_STRESS",      questionType:"SINGLE_SELECT", options:O18, text:"How often do you feel that your body's cellular repair and regeneration mechanisms are underperforming?" },
  // ── Domain 6: Cognitive Function — screenIndex 5, 10q × 18pt = 180 ──
  { id:"cf_01", screenIndex:5, category:"BRAIN_HEALTH",        pillar:"BALANCE_BRAIN",        questionType:"SINGLE_SELECT", options:O18, text:"How often do you experience difficulty with memory, recall, or retaining new information?" },
  { id:"cf_02", screenIndex:5, category:"BRAIN_HEALTH",        pillar:"BALANCE_BRAIN",        questionType:"SINGLE_SELECT", options:O18, text:"How often do you have trouble concentrating on complex tasks for extended periods?" },
  { id:"cf_03", screenIndex:5, category:"BRAIN_HEALTH",        pillar:"BALANCE_BRAIN",        questionType:"SINGLE_SELECT", options:O18, text:"How often do you experience brain fog that significantly impacts your daily functioning?" },
  { id:"cf_04", screenIndex:5, category:"BRAIN_HEALTH",        pillar:"BALANCE_BRAIN",        questionType:"SINGLE_SELECT", options:O18, text:"How often do you notice a decline in mental clarity, sharpness, or cognitive acuity?" },
  { id:"cf_05", screenIndex:5, category:"BRAIN_HEALTH",        pillar:"BALANCE_BRAIN",        questionType:"SINGLE_SELECT", options:O18, text:"How often do you experience mood instability, emotional dysregulation, or unexplained anxiety?" },
  { id:"cf_06", screenIndex:5, category:"BRAIN_HEALTH",        pillar:"BALANCE_BRAIN",        questionType:"SINGLE_SELECT", options:O18, text:"How often do you have difficulty with word retrieval, verbal expression, or finding the right words?" },
  { id:"cf_07", screenIndex:5, category:"BRAIN_HEALTH",        pillar:"BALANCE_BRAIN",        questionType:"SINGLE_SELECT", options:O18, text:"How often do you experience reduced motivation, mental drive, or executive function?" },
  { id:"cf_08", screenIndex:5, category:"BRAIN_HEALTH",        pillar:"BALANCE_BRAIN",        questionType:"SINGLE_SELECT", options:O18, text:"How often do you notice decreased cognitive processing speed or slower reaction times?" },
  { id:"cf_09", screenIndex:5, category:"BRAIN_HEALTH",        pillar:"BALANCE_BRAIN",        questionType:"SINGLE_SELECT", options:O18, text:"How often do you have difficulty making decisions, problem-solving, or planning ahead?" },
  { id:"cf_10", screenIndex:5, category:"BRAIN_HEALTH",        pillar:"BALANCE_BRAIN",        questionType:"SINGLE_SELECT", options:O18, text:"How often do you experience mental fatigue or cognitive exhaustion after moderate intellectual effort?" },
];

export const seedMfatConfig = mutation({
  args: {},
  handler: async (ctx) => {
    // Idempotency — skip if an active MFAT config already exists
    const existing = await ctx.db
      .query("assessmentConfigs")
      .withIndex("by_type_active", (q) =>
        q.eq("assessmentType", "MFAT").eq("isActive", true)
      )
      .first();
    if (existing) {
      return { status: "already_seeded", id: existing._id };
    }

    const now = Date.now();
    const id = await ctx.db.insert("assessmentConfigs", {
      assessmentType: "MFAT",
      version:        "1.0",
      isActive:       true,
      isPublic:       true,
      title:          "Mitochondrial Function Assessment",
      subtitle:       "MFAT — 58-Question Cellular Energy Evaluation",
      description:    "A 58-question clinical assessment evaluating mitochondrial health across six domains: Energy Production, Oxidative Stress, Inflammation, Metabolic Flexibility, Recovery Capacity, and Cognitive Function. Total scale: 1,120 points.",
      estimatedMins:  15,
      totalQuestions: 58,
      funnelTier:     "FREEMIUM",
      scoringConfig: {
        maxScore:      1120,
        scoringModel:  "SIMPLE_SUM",
        riskThresholds: {
          MINIMAL:  0,
          LOW:      21,
          MODERATE: 41,
          HIGH:     61,
          CRITICAL: 81,
        },
        compoundRiskRules:  [],
        protectiveFactors:  [],
      },
      questions: QUESTIONS as any,
      screens: [
        { index:0, title:"Energy Production",    description:"Cellular ATP production and energy metabolism — 10 questions, 200 pts",         questionIds:["ep_01","ep_02","ep_03","ep_04","ep_05","ep_06","ep_07","ep_08","ep_09","ep_10"] },
        { index:1, title:"Oxidative Stress",      description:"Reactive oxygen species burden and antioxidant defense — 9 questions, 180 pts",  questionIds:["os_01","os_02","os_03","os_04","os_05","os_06","os_07","os_08","os_09"] },
        { index:2, title:"Inflammation",          description:"Chronic inflammatory burden and immune reactivity — 10 questions, 200 pts",       questionIds:["inf_01","inf_02","inf_03","inf_04","inf_05","inf_06","inf_07","inf_08","inf_09","inf_10"] },
        { index:3, title:"Metabolic Flexibility", description:"Fuel substrate switching and insulin sensitivity — 9 questions, 180 pts",         questionIds:["mf_01","mf_02","mf_03","mf_04","mf_05","mf_06","mf_07","mf_08","mf_09"] },
        { index:4, title:"Recovery Capacity",     description:"Cellular regeneration, sleep quality, and stress resilience — 10 questions, 180 pts", questionIds:["rc_01","rc_02","rc_03","rc_04","rc_05","rc_06","rc_07","rc_08","rc_09","rc_10"] },
        { index:5, title:"Cognitive Function",    description:"Neuronal mitochondrial health and brain energy metabolism — 10 questions, 180 pts", questionIds:["cf_01","cf_02","cf_03","cf_04","cf_05","cf_06","cf_07","cf_08","cf_09","cf_10"] },
      ],
      createdAt: now,
      updatedAt: now,
    });

    return { status: "seeded", id };
  },
});

/** Reset MFAT seed — dev only */
export const resetMfatSeed = mutation({
  args: {},
  handler: async (ctx) => {
    const configs = await ctx.db
      .query("assessmentConfigs")
      .withIndex("by_type", (q) => q.eq("assessmentType", "MFAT"))
      .collect();
    for (const c of configs) await ctx.db.delete(c._id);
    return { status: "reset", deleted: configs.length };
  },
});
