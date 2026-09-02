import React, { useEffect, useRef } from "react";
import { PatientRequest } from "../../types";

interface AlertPanelProps {
  pendingCount: number;
  latestUrgent?: PatientRequest;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

/**
 * Slim status strip shown at the top of the dashboard. Plays an audible
 * chime whenever a new urgent (pain / emergency) request lands, and lets
 * the nurse mute/unmute audio alerts for their shift.
 */
export const AlertPanel: React.FC<AlertPanelProps> = ({
  pendingCount,
  latestUrgent,
  soundEnabled,
  onToggleSound,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastAlertedId = useRef<string | null>(null);

  useEffect(() => {
    if (!latestUrgent || !soundEnabled) return;
    if (lastAlertedId.current === latestUrgent.id) return;
    lastAlertedId.current = latestUrgent.id;
    audioRef.current?.play().catch(() => {
      // Autoplay can be blocked until the user interacts with the page once.
    });
  }, [latestUrgent, soundEnabled]);

  if (pendingCount === 0) return null;

  return (
    <div className="flex items-center justify-between gap-4 rounded-xl bg-ink-900 text-white px-5 py-3 mb-6 shadow-card">
      <div className="flex items-center gap-3">
        <span className="h-2.5 w-2.5 rounded-full bg-signal-coral animate-pulse-ring" />
        <p className="text-sm font-medium">
          {pendingCount} request{pendingCount === 1 ? "" : "s"} waiting for a response
        </p>
      </div>
      <button
        onClick={onToggleSound}
        aria-pressed={soundEnabled}
        className="text-xs font-medium px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
      >
        {soundEnabled ? "Mute alerts" : "Unmute alerts"}
      </button>
      <audio ref={audioRef} preload="auto">
        <source
          src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleB0FMJLl8LptIgQ4muHttm0mBDOW5O+7cSgELJPp8bppJwQylu3yuWonBSyS7vO3aCsEK5Lx9LVnLQQrk/P0tGYvBCqU9PWyZDAEKpX19bBjMgQplvb1r2IyBCqX9/auYTMEKZj49q1gNAQpmfj2rGA1BCma+fatYDQEKZr49qxfNQQqm/n2q181BCqb+farXjUEK5z6+KtdNgQrnfr4qlw2BC2e+/mqWzcELZ/7+alaNwQun/v5qFo4BC+g/PsA"
          type="audio/wav"
        />
      </audio>
    </div>
  );
};

export default AlertPanel;
