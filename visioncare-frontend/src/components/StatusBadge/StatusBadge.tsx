import React from "react";
import { RequestStatus } from "../../types";
import { STATUS_LABEL } from "../../utils/needConfig";

interface StatusBadgeProps {
  status: RequestStatus;
}

const STATUS_STYLES: Record<RequestStatus, string> = {
  pending: "bg-signal-amber/10 text-signal-amber",
  acknowledged: "bg-signal-teal/10 text-signal-teal",
  in_progress: "bg-signal-teal/10 text-signal-teal",
  completed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-gray-100 text-gray-600",
  false_positive: "bg-gray-100 text-gray-500",
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => (
  <span
    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${STATUS_STYLES[status]}`}
  >
    {STATUS_LABEL[status]}
  </span>
);

export default StatusBadge;
