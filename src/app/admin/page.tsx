"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  BarChart3,
  Clock,
  CheckCircle2,
  DollarSign,
  RefreshCw,
  ChevronDown,
  UserCheck,
  AlertTriangle,
  FileText,
  Users,
  Loader2,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────

interface TranslationJob {
  id: string;
  userId: string;
  userEmail: string;
  userName?: string;
  vendorId?: string;
  documentType: string;
  sourceLanguage: string;
  targetLanguage: string;
  totalPages: number;
  status: string;
  priceAed: number;
  vendorPayoutAed: number;
  stripeCheckoutSessionId?: string;
  dispatchChannel: string;
  certifiedPdfUrl?: string;
  wordDocUrl?: string;
  createdAt: string;
  paidAt?: string;
  dispatchedAt?: string;
  completedAt?: string;
  slaBreachAt?: string;
  refundTriggeredAt?: string;
}

interface Vendor {
  id: string;
  name: string;
  email: string;
  mojCertNumber: string;
  active: boolean;
  jobsCompleted: number;
}

const DEFAULT_VENDORS: Vendor[] = [
  {
    id: "vendor-1",
    name: "Vendor 1",
    email: "vendor1@example.com",
    mojCertNumber: "MOJ-001",
    active: true,
    jobsCompleted: 0,
  },
  {
    id: "vendor-2",
    name: "Vendor 2",
    email: "vendor2@example.com",
    mojCertNumber: "MOJ-002",
    active: true,
    jobsCompleted: 0,
  },
];

// ─── Helpers ────────────────────────────────────────────────

function formatTimeElapsed(createdAt: string): string {
  const diff = Date.now() - new Date(createdAt).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function getSlaColor(createdAt: string): string {
  const hoursElapsed =
    (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
  if (hoursElapsed < 12) return "text-green-400";
  if (hoursElapsed < 20) return "text-yellow-400";
  if (hoursElapsed < 24) return "text-orange-400";
  return "text-red-400";
}

function getStatusBadge(status: string): { label: string; classes: string } {
  switch (status) {
    case "pending_payment":
      return {
        label: "Pending Payment",
        classes: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
      };
    case "paid":
      return {
        label: "Paid",
        classes: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
      };
    case "dispatched":
      return {
        label: "Dispatched",
        classes: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
      };
    case "confirmed":
      return {
        label: "Confirmed",
        classes: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
      };
    case "in_translation":
      return {
        label: "In Translation",
        classes: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
      };
    case "completed":
      return {
        label: "Completed",
        classes: "bg-teal-500/20 text-teal-300 border-teal-500/30",
      };
    case "refunded":
      return {
        label: "Refunded",
        classes: "bg-red-500/20 text-red-300 border-red-500/30",
      };
    case "cancelled":
      return {
        label: "Cancelled",
        classes: "bg-neutral-500/20 text-neutral-300 border-neutral-500/30",
      };
    default:
      return {
        label: status,
        classes: "bg-neutral-500/20 text-neutral-300 border-neutral-500/30",
      };
  }
}

// ─── Component ──────────────────────────────────────────────

export default function AdminPage() {
  const { data: session, status: authStatus } = useSession();
  const [jobs, setJobs] = useState<TranslationJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    try {
      const res = await fetch("/api/translate/jobs?admin=true");
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs || []);
      }
    } catch (err) {
      console.error("Failed to fetch jobs:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authStatus === "authenticated") {
      fetchJobs();
    }
  }, [authStatus, fetchJobs]);

  async function updateJobStatus(
    jobId: string,
    updates: Record<string, unknown>
  ) {
    setActionLoading(jobId);
    try {
      const res = await fetch(`/api/translate/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const data = await res.json();
        setJobs((prev) =>
          prev.map((j) => (j.id === jobId ? data.job : j))
        );
      }
    } catch (err) {
      console.error("Failed to update job:", err);
    } finally {
      setActionLoading(null);
      setOpenDropdown(null);
    }
  }

  function handleMarkComplete(jobId: string) {
    updateJobStatus(jobId, {
      status: "completed",
      completedAt: new Date().toISOString(),
    });
  }

  function handleRefund(jobId: string) {
    updateJobStatus(jobId, {
      status: "refunded",
      refundTriggeredAt: new Date().toISOString(),
    });
  }

  function handleAssignVendor(jobId: string, vendorId: string) {
    updateJobStatus(jobId, {
      vendorId,
      status: "dispatched",
      dispatchedAt: new Date().toISOString(),
    });
  }

  // ─── Stats ────────────────────────────────────────────────

  const totalJobs = jobs.length;
  const activeJobs = jobs.filter((j) =>
    ["paid", "dispatched", "confirmed", "in_translation"].includes(j.status)
  ).length;
  const completedJobs = jobs.filter((j) => j.status === "completed").length;
  const totalRevenue = jobs
    .filter((j) => j.status === "completed")
    .reduce((sum, j) => sum + j.priceAed, 0);

  // ─── Auth guard ───────────────────────────────────────────

  if (authStatus === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gold-400" />
      </div>
    );
  }

  if (!session?.user?.email) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-warm-white/60">Please sign in to access admin.</p>
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────

  return (
    <div className="min-h-screen pt-28 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-warm-white">
              Translation Admin
            </h1>
            <p className="text-warm-white/50 mt-1">
              Manage translation jobs and vendors
            </p>
          </div>
          <button
            onClick={() => {
              setLoading(true);
              fetchJobs();
            }}
            className="glass flex items-center gap-2 px-4 py-2 rounded-lg text-warm-white/70 hover:text-warm-white transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="glass rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-gold-400/10">
                <BarChart3 className="w-5 h-5 text-gold-400" />
              </div>
              <span className="text-warm-white/50 text-sm">Total Jobs</span>
            </div>
            <p className="text-2xl font-bold text-warm-white">{totalJobs}</p>
          </div>

          <div className="glass rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-yellow-400/10">
                <Clock className="w-5 h-5 text-yellow-400" />
              </div>
              <span className="text-warm-white/50 text-sm">Active</span>
            </div>
            <p className="text-2xl font-bold text-warm-white">{activeJobs}</p>
          </div>

          <div className="glass rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-teal-400/10">
                <CheckCircle2 className="w-5 h-5 text-teal-400" />
              </div>
              <span className="text-warm-white/50 text-sm">Completed</span>
            </div>
            <p className="text-2xl font-bold text-warm-white">
              {completedJobs}
            </p>
          </div>

          <div className="glass rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-green-400/10">
                <DollarSign className="w-5 h-5 text-green-400" />
              </div>
              <span className="text-warm-white/50 text-sm">Revenue</span>
            </div>
            <p className="text-2xl font-bold text-warm-white">
              AED {totalRevenue.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Jobs Table */}
        <div className="glass rounded-xl overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-white/5">
            <h2 className="text-lg font-semibold text-warm-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-gold-400" />
              Translation Jobs
            </h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-gold-400" />
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-16">
              <FileText className="w-10 h-10 text-warm-white/20 mx-auto mb-3" />
              <p className="text-warm-white/40">No translation jobs yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left px-6 py-3 text-warm-white/40 font-medium">
                      Job ID
                    </th>
                    <th className="text-left px-6 py-3 text-warm-white/40 font-medium">
                      User
                    </th>
                    <th className="text-left px-6 py-3 text-warm-white/40 font-medium">
                      Doc Type
                    </th>
                    <th className="text-left px-6 py-3 text-warm-white/40 font-medium">
                      Pages
                    </th>
                    <th className="text-left px-6 py-3 text-warm-white/40 font-medium">
                      Status
                    </th>
                    <th className="text-left px-6 py-3 text-warm-white/40 font-medium">
                      Vendor
                    </th>
                    <th className="text-left px-6 py-3 text-warm-white/40 font-medium">
                      Time Elapsed
                    </th>
                    <th className="text-left px-6 py-3 text-warm-white/40 font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => {
                    const badge = getStatusBadge(job.status);
                    const isTerminal = ["completed", "refunded", "cancelled"].includes(
                      job.status
                    );
                    return (
                      <tr
                        key={job.id}
                        className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="px-6 py-4 text-warm-white/70 font-mono text-xs">
                          {job.id.slice(0, 8)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-warm-white text-sm">
                            {job.userName || "—"}
                          </div>
                          <div className="text-warm-white/40 text-xs">
                            {job.userEmail}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-warm-white/70 capitalize">
                          {job.documentType.replace(/_/g, " ")}
                        </td>
                        <td className="px-6 py-4 text-warm-white/70">
                          {job.totalPages}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium border ${badge.classes}`}
                          >
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-warm-white/70">
                          {job.vendorId || "—"}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`font-mono text-sm ${getSlaColor(job.createdAt)}`}
                          >
                            {formatTimeElapsed(job.createdAt)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {actionLoading === job.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-gold-400" />
                          ) : isTerminal ? (
                            <span className="text-warm-white/20 text-xs">—</span>
                          ) : (
                            <div className="relative">
                              <button
                                onClick={() =>
                                  setOpenDropdown(
                                    openDropdown === job.id ? null : job.id
                                  )
                                }
                                className="flex items-center gap-1 text-gold-400 hover:text-gold-300 text-xs font-medium transition-colors"
                              >
                                Actions
                                <ChevronDown className="w-3 h-3" />
                              </button>

                              {openDropdown === job.id && (
                                <div className="absolute right-0 top-full mt-1 z-50 glass rounded-lg border border-white/10 shadow-xl min-w-[180px]">
                                  {/* Assign Vendor */}
                                  <div className="px-3 py-2 border-b border-white/5">
                                    <p className="text-warm-white/40 text-xs mb-1.5">
                                      Assign Vendor
                                    </p>
                                    {DEFAULT_VENDORS.filter((v) => v.active).map(
                                      (vendor) => (
                                        <button
                                          key={vendor.id}
                                          onClick={() =>
                                            handleAssignVendor(job.id, vendor.id)
                                          }
                                          className="w-full text-left px-2 py-1.5 rounded text-sm text-warm-white/70 hover:bg-white/5 hover:text-warm-white transition-colors flex items-center gap-2"
                                        >
                                          <UserCheck className="w-3 h-3" />
                                          {vendor.name}
                                        </button>
                                      )
                                    )}
                                  </div>

                                  {/* Mark Complete */}
                                  <button
                                    onClick={() => handleMarkComplete(job.id)}
                                    className="w-full text-left px-3 py-2 text-sm text-teal-400 hover:bg-white/5 transition-colors flex items-center gap-2"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    Mark Complete
                                  </button>

                                  {/* Issue Refund */}
                                  <button
                                    onClick={() => handleRefund(job.id)}
                                    className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-white/5 transition-colors flex items-center gap-2 border-t border-white/5"
                                  >
                                    <AlertTriangle className="w-3.5 h-3.5" />
                                    Issue Refund
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Vendors Section */}
        <div className="glass rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5">
            <h2 className="text-lg font-semibold text-warm-white flex items-center gap-2">
              <Users className="w-5 h-5 text-gold-400" />
              Vendors
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-6">
            {DEFAULT_VENDORS.map((vendor) => (
              <div
                key={vendor.id}
                className="glass rounded-lg p-4 border border-white/5"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-warm-white font-medium">{vendor.name}</h3>
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                      vendor.active
                        ? "bg-green-500/20 text-green-300 border border-green-500/30"
                        : "bg-red-500/20 text-red-300 border border-red-500/30"
                    }`}
                  >
                    {vendor.active ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="space-y-1 text-sm text-warm-white/50">
                  <p>Email: {vendor.email}</p>
                  <p>MOJ Cert: {vendor.mojCertNumber}</p>
                  <p>
                    Jobs Completed:{" "}
                    {jobs.filter(
                      (j) =>
                        j.vendorId === vendor.id && j.status === "completed"
                    ).length}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
