/**
 * MUSCLE-META MATRIX™ — ADMIN DASHBOARD
 * =======================================
 * File: /app/admin/page.tsx
 *
 * Randy's command center for managing the founding cohort.
 * Shows cohort overview, risk tier distribution,
 * recent completions, and quick-action links.
 *
 * Randy Bauer PT — Muscle-Meta Matrix™
 */
"use client";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
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
const RISK_LABELS: Record<string, string> = {
  CRITICAL: "Critical",
  HIGH:     "High",
  MODERATE: "Moderate",
  LOW:      "Low",
  MINIMAL:  "Minimal",
};
export default function AdminDashboard() {
  const users       = useQuery(api.users.getAllUsers)            ?? [];
  const assessments = useQuery(api.assessments.getAllAssessments) ?? [];
  const totalUsers      = users.length;
  const activeUsers     = users.filter((u) => u.isActive).length;
  const foundingMembers = users.filter((u) => u.tier === "FOUNDING").length;
  const completedAsmts  = assessments.filter((a) => a.status === "SCORED").length;
  const inProgressAsmts = assessments.filter(
    (a) => a.status === "IN_PROGRESS" || a.status === "STARTED"
  ).length;
  const tierCounts = users.reduce((acc, u) => {
    if (u.latestRiskTier) acc[u.latestRiskTier] = (acc[u.latestRiskTier] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const estimatedMRR = foundingMembers * 47;
  const recentCompletions = [...assessments]
    .filter((a) => a.status === "SCORED" && a.scoredAt)
    .sort((a, b) => (b.scoredAt ?? 0) - (a.scoredAt ?? 0))
    .slice(0, 10);
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F8FAFC" }}>
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-serif font-semibold" style={{ color: NAVY }}>
              Admin Dashboard
            </h1>
            <p className="text-sm text-gray-400 font-sans mt-0.5">
              Muscle-Meta Matrix™ · Founding Cohort Management
            </p>
          </div>
          <Link
            href="/admin/users"
            className="px-4 py-2 rounded-lg text-sm font-sans font-medium"
            style={{ backgroundColor: `${TEAL}12`, color: TEAL }}
          >
            All Users →
          </Link>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Users",      value: totalUsers,      sub: `${activeUsers} active`,           color: NAVY },
            { label: "Founding Members", value: foundingMembers, sub: `$${estimatedMRR}/mo est. MRR`,    color: GOLD },
            { label: "Assessments Done", value: completedAsmts,  sub: `${inProgressAsmts} in progress`,  color: TEAL },
            { label: "Completion Rate",  value: totalUsers > 0
                ? `${Math.round((completedAsmts / Math.max(totalUsers,1)) * 100)}%`
                : "—",
              sub: "users → scored result", color: "#16A34A" },
          ].map((card) => (
            <div key={card.label} className="bg-white rounded-xl p-5 border border-gray-100">
              <div className="text-3xl font-bold font-sans mb-1" style={{ color: card.color }}>
                {card.value}
              </div>
              <div className="text-sm font-sans font-medium text-gray-700">{card.label}</div>
              <div className="text-xs text-gray-400 font-sans mt-0.5">{card.sub}</div>
            </div>
          ))}
        </div>
        {/* Risk tier distribution */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-lg font-serif font-semibold mb-5" style={{ color: NAVY }}>
            Cohort Risk Tier Distribution
          </h2>
          <div className="space-y-3">
            {["CRITICAL", "HIGH", "MODERATE", "LOW", "MINIMAL"].map((tier) => {
              const count = tierCounts[tier] ?? 0;
              const pct   = totalUsers > 0 ? Math.round((count / totalUsers) * 100) : 0;
              const color = RISK_COLORS[tier];
              return (
                <div key={tier} className="flex items-center gap-4">
                  <div className="w-20 text-xs font-sans font-medium text-right" style={{ color }}>
                    {RISK_LABELS[tier]}
                  </div>
                  <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full flex items-center px-2 transition-all duration-700"
                      style={{
                        width: `${Math.max(pct, count > 0 ? 4 : 0)}%`,
                        backgroundColor: color,
                      }}
                    >
                      {count > 0 && (
                        <span className="text-white text-xs font-sans font-bold">{count}</span>
                      )}
                    </div>
                  </div>
                  <div className="w-10 text-xs font-sans text-gray-400 text-right">{pct}%</div>
                </div>
              );
            })}
          </div>
          {Object.keys(tierCounts).length === 0 && (
            <p className="text-sm text-gray-400 font-sans text-center py-4">
              No completed assessments yet — they appear here once scored.
            </p>
          )}
        </div>
        {/* Recent completions */}
        <div className="bg-white rounded-xl border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-serif font-semibold" style={{ color: NAVY }}>
              Recent Completions
            </h2>
            <Link href="/admin/users" className="text-sm font-sans" style={{ color: TEAL }}>
              View all →
            </Link>
          </div>
          {recentCompletions.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <p className="text-sm text-gray-400 font-sans">No completions yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentCompletions.map((a) => {
                const user = users.find((u) => u._id === a.userId);
                const tier = user?.latestRiskTier;
                return (
                  <Link
                    key={a._id}
                    href={`/admin/users/${a.userId}`}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors"
                  >
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-sans font-bold flex-shrink-0"
                      style={{ backgroundColor: TEAL }}
                    >
                      {user?.firstName?.[0] ?? user?.email?.[0]?.toUpperCase() ?? "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-sans font-medium truncate" style={{ color: NAVY }}>
                        {user?.firstName && user?.lastName
                          ? `${user.firstName} ${user.lastName}`
                          : user?.email ?? "Unknown"}
                      </div>
                      <div className="text-xs text-gray-400 font-sans">
                        {a.assessmentType} ·{" "}
                        {a.scoredAt
                          ? new Date(a.scoredAt).toLocaleDateString("en-US", {
                              month: "short", day: "numeric",
                              hour: "numeric", minute: "2-digit",
                            })
                          : "—"}
                      </div>
                    </div>
                    {tier && (
                      <div
                        className="px-3 py-1 rounded-full text-xs font-sans font-semibold flex-shrink-0"
                        style={{
                          backgroundColor: `${RISK_COLORS[tier]}15`,
                          color: RISK_COLORS[tier],
                        }}
                      >
                        {RISK_LABELS[tier]}
                      </div>
                    )}
                    <span className="text-gray-300 text-sm">→</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
        {/* Quick actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { title: "All Users",         desc: "Browse and manage all users",                  href: "/admin/users",            color: TEAL },
            { title: "High + Critical",   desc: "Users needing immediate outreach",             href: "/admin/users?tier=HIGH",  color: "#EA580C" },
            { title: "Founding Cohort",   desc: "Your $47/mo founding members",                 href: "/admin/users?tier=FOUNDING", color: GOLD },
          ].map((a) => (
            <Link
              key={a.title}
              href={a.href}
              className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-sm transition-all group"
            >
              <div className="text-sm font-sans font-semibold mb-1 group-hover:underline" style={{ color: a.color }}>
                {a.title} →
              </div>
              <div className="text-xs text-gray-400 font-sans">{a.desc}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
