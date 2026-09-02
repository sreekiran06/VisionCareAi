import React, { useEffect, useState } from "react";
import { PatientRequest, RequestStatus } from "../../types";
import { NEED_CONFIG, getTimeAgo } from "../../utils/needConfig";
import { NeedBadge } from "../NeedBadge/NeedBadge";

interface PatientCardProps {
  request: PatientRequest;
  onAcknowledge: (requestId: string, status: RequestStatus) => void;
  urgent?: boolean;
}

export const PatientCard: React.FC<PatientCardProps> = ({
  request,
  onAcknowledge,
  urgent = false,
}) => {
  const [, forceTick] = useState(0);
  const config = NEED_CONFIG[request.need];

  // Re-render every 15s so "time ago" stays fresh without a global timer.
  useEffect(() => {
    const id = setInterval(() => forceTick((t) => t + 1), 15000);
    return () => clearInterval(id);
  }, []);

  const ringClass = urgent ? config.ringClass ?? "" : "";

  return (
    <div
      className={`bg-white rounded-xl shadow-card p-5 animate-slide-in ${ringClass}`}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <span className="text-2xl font-display font-bold text-ink-900">
            Bed {request.bedNumber}
          </span>
          <p className="text-gray-600">{request.patientName}</p>
        </div>
        <span className="text-3xl" aria-hidden="true">
          {config.icon}
        </span>
      </div>

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <NeedBadge need={request.need} />
        <span className="text-gray-500 text-sm">
          {getTimeAgo(request.timestamp)}
        </span>
        <span className="text-gray-400 text-sm ml-auto font-mono">
          {Math.round(request.confidence * 100)}% conf.
        </span>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onAcknowledge(request.id, "acknowledged")}
          className="flex-1 py-2 px-4 bg-signal-teal text-white rounded-lg font-medium
                     hover:bg-signal-teal/90 transition-colors"
        >
          Acknowledge
        </button>
        <button
          onClick={() => onAcknowledge(request.id, "completed")}
          className="flex-1 py-2 px-4 bg-ink-900 text-white rounded-lg font-medium
                     hover:bg-ink-800 transition-colors"
        >
          Complete
        </button>
        <button
          onClick={() => onAcknowledge(request.id, "false_positive")}
          title="Mark as false positive"
          aria-label="Mark as false positive"
          className="py-2 px-3 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default PatientCard;
