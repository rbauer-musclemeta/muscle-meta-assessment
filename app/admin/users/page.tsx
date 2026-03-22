/**
 * MUSCLE-META MATRIX™ — ADMIN USERS LIST
 * ========================================
 * File: /app/admin/users/page.tsx
 *
 * Full user table with risk tier filtering.
 * Click any row → user detail page.
 *
 * Randy Bauer PT — Muscle-Meta Matrix™
 */
"use client";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { useState, useMemo } from "react";
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
const TIER_FILTERS = ["ALL", "CRITICAL", "HIGH", "MODERATE", "LOW", "MINIMAL", "FOUNDING"] as const;
export default function AdminUsersPage() {
  const users       = useQuery(api.users.getAllUsers)            ?? [];
  const assessments = useQuery(api.assessments.getAllAssessments) ?? [];
  const upgradeUser = useMutation(api.users.upgradeToFounding);
  const [tierFilter, setTierFilter]   = useState<string>("ALL");
  const [search, setSearch]           = useState("");
  const [upgradingId, setUpgradingId] = useState<string | null>(null);
  const filtered = useMemo(() => {
    return users.filter((u) => {
      const matchesTier =
        tierFilter === "ALL"      ? true :
        tierFilter === "FOUNDING" ? u.tier === "FOUNDING" :
        u.latestRiskTier === tierFilter;
      const term = search.toLowerCase();
      const matchesSearch =
        !term ||
        u.email?.toLowerCase().includes(term) ||
        u.firstName?.toLowerCase().includes(term) ||
        u.lastName?.toLowerCase().includes(term);
      return matchesTier && matchesSearch;
    });
  }, [users, tierFilter, search]);
  const getAssessmentCount = (userId: string) =>
    assessments.filter((a) => a.userId === userId && a.status === "SCORED").length;
  const handleUpgrade = async (clerkUserId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setUpgradingId(clerkUserId);
    try {
      await upgradeUser({ clerkUserId });
    } finally {
      setUpgradingId(null);
    }
  };
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F8FAFC" }}>
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="text-sm text-gray-400 hover:text-gray-600 font-sans">
              ← Dashboard
            </Link>
            <span className="text-gray-200">/</span>
            <h1 className="text-xl font-serif font-semibold" style={{ color: NAVY }}>
              Users
            </h1>
            <div
              className="px-2.5 py-0.5 rounded-full text-xs font-sans font-medium"
              style={{ backgroundColor: `${TEAL}12`, color: TEAL }}
            >
              {users.length}
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-6 py-6 space-y-5">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-lg border text-sm font-sans focus:outline-none focus:ring-2"
            style={{ borderColor: "#E2E8F0", color: NAVY }}
          />
          {/* Tier filter pills */}
          <div className="flex gap-2 flex-wrap">
            {TIER_FILTERS.map((t) => (
              <button
                key={t}
                onClick={() => setTierFilter(t)}
                className="px-3 py-2 rounded-lg text-xs font-sans font-medium transition-all"
                style={{
                  backgroundColor: tierFilter === t
                    ? (t === "ALL" ? NAVY : t === "FOUNDING" ? GOLD : RISK_COLORS[t] ?? NAVY)
                    : "#F1F5F9",
                  color: tierFilter === t ? "white" : "#64748B",
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        {/* Count */}
        <p className="text-sm text-gray-400 font-sans">
          Showing {filtered.length} of {users.length} users
        </p>
        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {filtered.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm text-gray-400 font-sans">No users match this filter.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {/* Table header */}
              <div className="grid grid-cols-12 px-6 py-3 text-xs font-sans font-medium text-gray-400 uppercase tracking-wide">
                <div className="col-span-4">User</div>
                <div className="col-span-2 text-center">Risk Tier</div>
                <div className="col-span-2 text-center">Plan</div>
                <div className="col-span-2 text-center">Assessments</div>
                <div className="col-span-2 text-right">Actions</div>
              </div>
              {filtered.map((user) => {
                const tier  = user.latestRiskTier;
                const color = tier ? RISK_COLORS[tier] : "#94A3B8";
                const asmtCount = getAssessmentCount(user._id);
                return (
                  <Link
                    key={user._id}
                    href={`/admin/users/${user._id}`}
                    className="grid grid-cols-12 px-6 py-4 hover:bg-gray-50 transition-colors items-center"
                  >
                    {/* User */}
                    <div className="col-span-4 flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-sans font-bold flex-shrink-0"
                        style={{ backgroundColor: tier ? color : "#94A3B8" }}
                      >
                        {user.firstName?.[0] ?? user.email?.[0]?.toUpperCase() ?? "?"}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-sans font-medium truncate" style={{ color: NAVY }}>
                          {user.firstName && user.lastName
                            ? `${user.firstName} ${user.lastName}`
                            : user.email}
                        </div>
                        {user.firstName && (
                          <div className="text-xs text-gray-400 font-sans truncate">
                            {user.email}
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Risk tier */}
                    <div className="col-span-2 flex justify-center">
                      {tier ? (
                        <span
                          className="px-2.5 py-1 rounded-full text-xs font-sans font-semibold"
                          style={{ backgroundColor: `${color}15`, color }}
                        >
                          {tier}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-300 font-sans">—</span>
                      )}
                    </div>
                    {/* Plan */}
                    <div className="col-span-2 flex justify-center">
                      <span
                        className="px-2.5 py-1 rounded-full text-xs font-sans font-semibold"
                        style={{
                          backgroundColor: user.tier === "FOUNDING" ? `${GOLD}20` : "#F1F5F9",
                          color: user.tier === "FOUNDING" ? GOLD : "#94A3B8",
                        }}
                      >
                        {user.tier}
                      </span>
                    </div>
                    {/* Assessment count */}
                    <div className="col-span-2 text-center">
                      <span className="text-sm font-sans" style={{ color: NAVY }}>
                        {asmtCount}
                      </span>
                      <span className="text-xs text-gray-400 font-sans ml-1">scored</span>
                    </div>
                    {/* Actions */}
                    <div className="col-span-2 flex justify-end gap-2" onClick={(e) => e.preventDefault()}>
                      {user.tier !== "FOUNDING" && (
                        <button
                          onClick={(e) => handleUpgrade(user.clerkUserId, e)}
                          disabled={upgradingId === user.clerkUserId}
                          className="px-2.5 py-1 rounded-lg text-xs font-sans font-medium transition-all"
                          style={{
                            backgroundColor: `${GOLD}15`,
                            color: GOLD,
                          }}
                        >
                          {upgradingId === user.clerkUserId ? "…" : "Upgrade"}
                        </button>
                      )}
                      <span className="text-gray-300 text-sm self-center">→</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
