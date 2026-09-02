import { NeedType, RequestStatus } from "../types";

export interface NeedConfigEntry {
  icon: string;
  label: string;
  badgeClass: string;
  ringClass?: string;
}

export const NEED_CONFIG: Record<NeedType, NeedConfigEntry> = {
  water: {
    icon: "💧",
    label: "Water",
    badgeClass: "bg-signal-teal/10 text-signal-teal",
  },
  food: {
    icon: "🍽️",
    label: "Food",
    badgeClass: "bg-emerald-100 text-emerald-800",
  },
  nurse: {
    icon: "👩‍⚕️",
    label: "Nurse",
    badgeClass: "bg-violet-100 text-violet-800",
  },
  pain: {
    icon: "⚠️",
    label: "Pain",
    badgeClass: "bg-signal-coral/10 text-signal-coral",
    ringClass: "ring-2 ring-signal-coral",
  },
  washroom: {
    icon: "🚻",
    label: "Washroom",
    badgeClass: "bg-signal-amber/10 text-signal-amber",
  },
  emergency: {
    icon: "🚨",
    label: "Emergency",
    badgeClass: "bg-signal-coral text-white",
    ringClass: "ring-2 ring-signal-coral",
  },
};

export const STATUS_LABEL: Record<RequestStatus, string> = {
  pending: "Pending",
  acknowledged: "Acknowledged",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
  false_positive: "False positive",
};

export function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}
