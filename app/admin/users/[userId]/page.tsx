/**
 * MUSCLE-META MATRIX™ — ADMIN USER DETAIL
 * =========================================
 * File: /app/admin/users/[userId]/page.tsx
 *
 * Full profile view for a single user.
 * Shows: profile, all assessments, latest results,
 * axis scores, compound risks, Randy's notes.
 *
 * Randy Bauer PT — Muscle-Meta Matrix™
 */
"use client";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import type { Id } from "@/convex/_generated/dataModel";
const TEAL = "#009090";
const NAVY = "#1A2B4A";
const GOLD = "#D4AF37";
const RISK_COLORS: Record<string, string> = {
  CRITICAL: "#DC2626",
  HIGH:     "#EA580C",
  MODERATE: "#D97706",
  LOW:      "#16A34A",
  MINIMAL:  "#009090",
};
const AXIS_ICONS: Record<string, string> = {
  BONE: "🦴", MUSCLE: "💪", METABOLIC: "⚡", GUT: "🫁", BRAIN: "🧠",
};
export default function AdminUserDetail() {
  const { userId } = useParams<{ userId: string }>();
  const user        = useQuery(api.users.getById, { userId: userId as Id<"users"> });
  const assessments = useQuery(api.assessments.getAssessmentsByUser,
    user ? { clerkUserId: user.clerkUserId } : "skip"
  ) ?? [];
  const latestResult = useQuery(api.results.getLatestResultByUser,
    user ? { clerkUserId: user.clerkUserId } : "skip"
  );
  const upgradeUser = useMutation(api.users.upgradeToFounding);
  const [upgrading, setUpgrading] = useState(false);
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#F8FAFC" }}>
        <div className="text-center">
          <div
            className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin mx-auto mb-3"
            style={{ borderColor: `${TEAL}40`, borderTopColor: TEAL }}
          />
          <p className="text-sm text-gray-400 font-sans">Loading user…</p>
        </div>
      </div>
    );
  }
  const tier       = user.latestRiskTier;
  const riskColor  = tier ? RISK_COLORS[tier] : "#94A3B8";
  const scoredAsmts = assessments.filter((a) => a.status === "SCORED");
  const handleUpgrade = async () => {
    setUpgrading(true);
    try {
      await upgradeUser({ clerkUserId: user.clerkUserId });
    } finally {
      setUpgrading(false);
    }
  };
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F8FAFC" }}>
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-5">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin/users" className="text-sm text-gray-400 hover:text-gray-600 font-sans">
              ← Users
            </Link>
            <span className="text-gray-200">/</span>
            <h1 className="text-xl font-serif font-semibold" style={{ color: NAVY }}>
              {user.firstName && user.lastName
                ? `${user.firstName} ${user.lastName}`
                : user.email}
            </h1>
            {tier && (
              <span
                className="px-2.5 py-1 rounded-full text-xs font-sans font-semibold"
                style={{ backgroundColor: `${riskColor}15`, color: riskColor }}
              >
                {tier}
              </span>
            )}
          </div>
          {/* Upgrade button */}
          {user.tier !== "FOUNDING" && (
            <button
              onClick={handleUpgrade}
              disabled={upgrading}
              className="px-4 py-2 rounded-lg text-sm font-sans font-semibold transition-all"
              style={{ backgroundColor: GOLD, color: "white" }}
            >
              {upgrading ? "Upgrading…" : "↑ Upgrade to Founding"}
            </button>
          )}
          {user.tier === "FOUNDING" && (
            <div
              className="px-4 py-2 rounded-lg text-sm font-sans font-semibold"
              style={{ backgroundColor: `${GOLD}15`, color: GOLD }}
            >
              ★ Founding Member
            </div>
          )}
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left column — profile */}
          <div className="space-y-5">
            {/* Profile card */}
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h2 className="text-sm font-sans font-semibold uppercase tracking-wide text-gray-400 mb-4">
                Profile
              </h2>
              <div className="space-y-3">
                {[
                  { label: "Email",      value: user.email },
                  { label: "Age",        value: user.age ? `${user.age} years` : "—" },
                  { label: "Sex",        value: user.sex ?? "—" },
                  { label: "Weight",     value: user.weightKg ? `${user.weightKg} kg` : "—" },
                  { label: "Goal",       value: user.primaryGoal ?? "—" },
                  { label: "Plan",       value: user.tier },
                  { label: "Role",       value: user.role },
                  { label: "Joined",     value: new Date(user.createdAt).toLocaleDateString("en-US",
                      { month: "short", day: "numeric", year: "numeric" }) },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-start gap-2">
                    <span className="text-xs text-gray-400 font-sans">{label}</span>
                    <span className="text-xs font-sans font-medium text-right" style={{ color: NAVY }}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            {/* Population flags */}
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h2 className="text-sm font-sans font-semibold uppercase tracking-wide text-gray-400 mb-3">
                Population Flags
              </h2>
              <div className="space-y-2">
                {[
                  { flag: user.isGLP1User,         label: "GLP-1 User",            color: "#EA580C" },
                  { flag: user.isPostSurgical,      label: "Post-Surgical",         color: "#DC2626" },
                  { flag: user.isPostHospital,      label: "Post-Hospital",         color: "#D97706" },
                  { flag: user.isPickleballPlayer,  label: "Pickleball Player",     color: TEAL },
                  { flag: user.isHealthcarePro,     label: "Healthcare Professional", color: "#7C3AED" },
                ].map(({ flag, label, color }) => (
                  <div
                    key={label}
                    className="flex items-center gap-2 text-xs font-sans"
                    style={{ color: flag ? color : "#CBD5E1" }}
                  >
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: flag ? color : "#E2E8F0" }}
                    />
                    {label}
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Right column — assessment data */}
          <div className="md:col-span-2 space-y-5">
            {/* Latest GMMBB axis scores */}
            {latestResult?.axisScores && (
              <div className="bg-white rounded-xl border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-sans font-semibold uppercase tracking-wide text-gray-400">
                    Latest GMMBB Axis Scores
                  </h2>
                  {latestResult.riskTier && (
                    <span
                      className="px-2.5 py-1 rounded-full text-xs font-sans font-bold"
                      style={{
                        backgroundColor: `${RISK_COLORS[latestResult.riskTier]}15`,
                        color: RISK_COLORS[latestResult.riskTier],
                      }}
                    >
                      Overall: {latestResult.percentScore}% — {latestResult.riskTier}
                    </span>
                  )}
                </div>
                <div className="space-y-3">
                  {Object.entries(latestResult.axisScores).map(([axis, data]: [string, any]) => {
                    if (!data) return null;
                    const color = RISK_COLORS[data.riskTier] ?? "#94A3B8";
                    return (
                      <div key={axis}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-sans font-medium" style={{ color: NAVY }}>
                            {AXIS_ICONS[axis]} {axis}
                          </span>
                          <span className="text-xs font-sans" style={{ color }}>
                            {data.percentile}% — {data.riskTier}
                          </span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${data.percentile}%`, backgroundColor: color }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {/* Compound risk flags */}
            {latestResult?.hasCompoundRisk && (
              <div
                className="rounded-xl border p-4"
                style={{ backgroundColor: "#FEF2F2", borderColor: "#FECACA" }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span>🚨</span>
                  <h2 className="text-sm font-sans font-semibold text-red-700">
                    Compound Risk Detected
                  </h2>
                </div>
                <p className="text-xs text-red-600 font-sans">
                  This user has {latestResult.compoundRisksDetected.length} compound risk flag(s).
                  Review their full results and consider direct outreach.
                </p>
              </div>
            )}
            {/* Assessment history */}
            <div className="bg-white rounded-xl border border-gray-100">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="text-sm font-sans font-semibold uppercase tracking-wide text-gray-400">
                  Assessment History ({scoredAsmts.length} completed)
                </h2>
              </div>
              {assessments.length === 0 ? (
                <div className="px-5 py-8 text-center">
                  <p className="text-sm text-gray-400 font-sans">No assessments yet.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {assessments.map((a) => (
                    <div key={a._id} className="flex items-center gap-4 px-5 py-3.5">
                      <div className="flex-1">
                        <div className="text-sm font-sans font-medium" style={{ color: NAVY }}>
                          {a.assessmentType}
                          {a.reassessmentNumber > 0 && (
                            <span className="text-xs text-gray-400 ml-1">
                              (Re-assessment #{a.reassessmentNumber})
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-400 font-sans">
                          {a.startedAt
                            ? new Date(a.startedAt).toLocaleDateString("en-US", {
                                month: "short", day: "numeric", year: "numeric",
                              })
                            : "—"}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className="px-2 py-0.5 rounded text-xs font-sans"
                          style={{
                            backgroundColor:
                              a.status === "SCORED"      ? "#F0FDF4" :
                              a.status === "IN_PROGRESS" ? "#FFF7ED" :
                              a.status === "SUBMITTED"   ? "#EFF6FF" : "#F8FAFC",
                            color:
                              a.status === "SCORED"      ? "#16A34A" :
                              a.status === "IN_PROGRESS" ? "#D97706" :
                              a.status === "SUBMITTED"   ? "#2563EB" : "#94A3B8",
                          }}
                        >
                          {a.status}
                        </span>
                        <span className="text-xs text-gray-400 font-sans">
                          {a.percentComplete}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
