import React from "react";
import { NeedType, RequestStatus, PatientCondition } from "../../types";

// ─── Need Badge ──────────────────────────────────────────────────────────────
const NEED_CONFIG: Record<NeedType, { label: string; className: string; dot: string }> = {
  water:     { label: "Water",     className: "bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-800",      dot: "bg-brand-500"    },
  food:      { label: "Food",      className: "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800",        dot: "bg-amber-500"    },
  nurse:     { label: "Nurse",     className: "bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400 border border-violet-200 dark:border-violet-800",  dot: "bg-violet-500"   },
  pain:      { label: "Pain",      className: "bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800",              dot: "bg-rose-500"     },
  washroom:  { label: "Washroom",  className: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800", dot: "bg-emerald-500" },
  emergency: { label: "Emergency", className: "bg-rose-100 dark:bg-rose-900/30 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-700 font-bold",   dot: "bg-rose-600 animate-pulse" },
};

interface NeedBadgeProps { need: NeedType; size?: "sm" | "md"; }
export const NeedBadge: React.FC<NeedBadgeProps> = ({ need, size = "md" }) => {
  const cfg = NEED_CONFIG[need] ?? NEED_CONFIG.nurse;
  return (
    <span className={`badge ${cfg.className} ${size === "sm" ? "text-[11px] px-1.5 py-0.5" : ""}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};

// ─── Status Badge ─────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<RequestStatus, { label: string; className: string }> = {
  pending:        { label: "Pending",        className: "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800"            },
  acknowledged:   { label: "Acknowledged",   className: "bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400 border border-brand-200 dark:border-brand-800"           },
  in_progress:    { label: "In Progress",    className: "bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400 border border-violet-200 dark:border-violet-800"     },
  completed:      { label: "Completed",      className: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"},
  cancelled:      { label: "Cancelled",      className: "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700"             },
  false_positive: { label: "False Positive", className: "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700"             },
};

interface StatusBadgeProps { status: RequestStatus; }
export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  return <span className={`badge ${cfg.className}`}>{cfg.label}</span>;
};

// ─── Risk Badge ───────────────────────────────────────────────────────────────
type RiskLevel = "critical" | "high" | "medium" | "low";
const RISK_CONFIG: Record<RiskLevel, { label: string; className: string }> = {
  critical: { label: "Critical", className: "bg-rose-100 dark:bg-rose-900/30 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-700 font-bold" },
  high:     { label: "High",     className: "bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800"  },
  medium:   { label: "Medium",   className: "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800"        },
  low:      { label: "Low",      className: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"},
};

interface RiskBadgeProps { risk: RiskLevel; }
export const RiskBadge: React.FC<RiskBadgeProps> = ({ risk }) => {
  const cfg = RISK_CONFIG[risk] ?? RISK_CONFIG.low;
  return <span className={`badge ${cfg.className}`}>{cfg.label}</span>;
};

// ─── Condition Badge ──────────────────────────────────────────────────────────
const CONDITION_LABELS: Record<PatientCondition, string> = {
  stroke:       "Stroke",
  als:          "ALS",
  paralysis:    "Paralysis",
  post_surgery: "Post Surgery",
  elderly:      "Elderly",
  other:        "Other",
};

interface ConditionBadgeProps { condition: PatientCondition; }
export const ConditionBadge: React.FC<ConditionBadgeProps> = ({ condition }) => (
  <span className="badge bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
    {CONDITION_LABELS[condition] ?? condition}
  </span>
);

// ─── Connection Status Badge ──────────────────────────────────────────────────
type ConnectionStatus = "connecting" | "connected" | "disconnected";
interface ConnectionBadgeProps { status: ConnectionStatus; }
export const ConnectionBadge: React.FC<ConnectionBadgeProps> = ({ status }) => {
  const cfg = {
    connected:    { dot: "bg-emerald-500",                    label: "Live",         cls: "text-emerald-700 dark:text-emerald-400" },
    connecting:   { dot: "bg-amber-500 animate-pulse",        label: "Connecting",   cls: "text-amber-700 dark:text-amber-400"     },
    disconnected: { dot: "bg-slate-400",                      label: "Offline",      cls: "text-slate-500 dark:text-slate-400"     },
  }[status];
  return (
    <span className={`flex items-center gap-1.5 text-xs font-semibold ${cfg.cls}`}>
      <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};

// ─── Gesture Badge ────────────────────────────────────────────────────────────
interface GestureBadgeProps { gesture: string; confidence?: number; }
export const GestureBadge: React.FC<GestureBadgeProps> = ({ gesture, confidence }) => {
  const label = gesture.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return (
    <span className="flex items-center gap-1.5">
      <span className="badge bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400 border border-violet-200 dark:border-violet-800">
        {label}
      </span>
      {confidence != null && (
        <span className="text-xs text-slate-400 font-mono">{Math.round(confidence * 100)}%</span>
      )}
    </span>
  );
};

export default NeedBadge;
