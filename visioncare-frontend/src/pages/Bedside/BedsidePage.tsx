import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { CameraFeed } from "../../components/CameraFeed/CameraFeed";
import { patientsApi } from "../../services/api";
import { Patient, ConnectionStatus } from "../../types";

export const BedsidePage: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>("connecting");

  useEffect(() => {
    if (!patientId) return;
    (async () => {
      try {
        const res = await patientsApi.get(patientId);
        setPatient(res.data);
      } catch {
        setError("Could not load patient details for bedside monitoring.");
      }
    })();
  }, [patientId]);

  if (error) {
    return (
      <div className="min-h-screen bg-ink-950 flex flex-col items-center justify-center p-6 text-white text-center">
        <div className="max-w-md bg-ink-900 border border-signal-coral/20 rounded-xl p-6 shadow-2xl">
          <span className="text-4xl mb-4 block">⚠️</span>
          <h2 className="text-xl font-display font-bold text-signal-coral mb-2">Error</h2>
          <p className="text-white/60 mb-6">{error}</p>
          <Link to="/dashboard" className="inline-block px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors font-medium">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen bg-ink-950 flex flex-col items-center justify-center text-white">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-signal-teal border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink-950 flex flex-col justify-between p-6 md:p-10 text-white">
      {/* Header */}
      <header className="max-w-4xl mx-auto w-full flex justify-between items-center mb-6">
        <div>
          <span className="text-sm font-mono tracking-widest text-white/40 uppercase">Bedside Camera</span>
          <h1 className="text-2xl md:text-3xl font-display font-bold mt-1 text-white">
            {patient.name} <span className="text-white/40 font-normal">| Bed {patient.bed_number}</span>
          </h1>
        </div>
        <Link to="/dashboard" className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg transition-all font-medium">
          Dashboard
        </Link>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto w-full flex-1 flex flex-col justify-center gap-8">
        <div className="bg-ink-900 border border-white/5 rounded-2xl overflow-hidden shadow-2xl p-4 md:p-6">
          <CameraFeed 
            patientId={patient.id} 
            onStatusChange={setStatus}
          />
        </div>

        <div className="bg-ink-900/50 border border-white/5 rounded-xl p-5 max-w-xl mx-auto w-full text-center">
          <h2 className="font-semibold text-white mb-2"> bedside Streaming Status</h2>
          <p className="text-sm text-white/60 mb-4">
            {status === "connected" 
              ? "Currently streaming frames from your webcam. Keep this window open and make gestures to trigger nurse alerts."
              : status === "connecting"
              ? "Establishing secure connection to gesture detection server..."
              : "Disconnected. Please ensure the backend is running and refresh."}
          </p>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-black/40 rounded-full">
            <span className={`h-2.5 w-2.5 rounded-full ${
              status === "connected" ? "bg-emerald-400" : status === "connecting" ? "bg-signal-amber animate-pulse" : "bg-signal-coral"
            }`} />
            <span className="text-xs uppercase font-mono tracking-wide">{status}</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto w-full text-center text-xs text-white/30 mt-8">
        VisionCare Bedside Module. Ensure lighting is sufficient for accurate landmark tracking.
      </footer>
    </div>
  );
};

export default BedsidePage;
