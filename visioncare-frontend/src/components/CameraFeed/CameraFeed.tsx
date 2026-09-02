import React, { useCallback, useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import { ConnectionStatus } from "../../types";

interface CameraFeedProps {
  patientId: string;
  wsUrl?: string;
  frameIntervalMs?: number;
  onStatusChange?: (status: ConnectionStatus) => void;
}

const DEFAULT_WS_URL = process.env.REACT_APP_WS_URL ?? "ws://localhost:8001";

/**
 * Streams JPEG frames from the bedside camera to the backend gesture
 * pipeline over WebSocket. Runs on the patient-facing device, not the
 * nurse dashboard.
 */
export const CameraFeed: React.FC<CameraFeedProps> = ({
  patientId,
  wsUrl = DEFAULT_WS_URL,
  frameIntervalMs = 200,
  onStatusChange,
}) => {
  const webcamRef = useRef<Webcam>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [ear, setEar] = useState<number>(0.3);
  const [mar, setMar] = useState<number>(0.2);
  const [activeGesture, setActiveGesture] = useState<string>("resting");
  const [progress, setProgress] = useState<number>(0);

  const updateStatus = useCallback(
    (next: ConnectionStatus) => {
      setStatus(next);
      onStatusChange?.(next);
    },
    [onStatusChange]
  );

  useEffect(() => {
    const socket = new WebSocket(`${wsUrl}/ws/camera/${patientId}`);
    socketRef.current = socket;

    socket.onopen = () => {
      updateStatus("connected");
      intervalRef.current = setInterval(() => {
        const frame = webcamRef.current?.getScreenshot();
        if (frame && socket.readyState === WebSocket.OPEN) {
          socket.send(frame);
        }
      }, frameIntervalMs);
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "processed_frame") {
          setProcessedImage(data.image);
        } else if (data.type === "telemetry") {
          setEar(data.ear);
          setMar(data.mar);
          setActiveGesture(data.active_gesture);
          setProgress(data.progress);
        }
      } catch (err) {
        // Safe skip
      }
    };

    socket.onclose = () => {
      updateStatus("disconnected");
      setProcessedImage(null);
    };
    socket.onerror = () => socket.close();

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      socket.close();
    };
  }, [patientId, wsUrl, frameIntervalMs, updateStatus]);

  const getGestureLabel = (g: string) => {
    if (g === "eyes_closed") return "Sustained Eyes Closed";
    if (g === "mouth_open") return "Mouth Opened / Yawn";
    if (g === "head_left") return "Head Turn Left";
    if (g === "head_right") return "Head Turn Right";
    return "Normal / Resting";
  };

  return (
    <div className="relative aspect-video bg-slate-950 rounded-2xl overflow-hidden shadow-2xl border border-slate-800">

      {/* ── Raw webcam feed – always visible as the base layer ── */}
      <Webcam
        ref={webcamRef}
        audio={false}
        screenshotFormat="image/jpeg"
        screenshotQuality={0.7}
        className="w-full h-full object-cover"
        mirrored
      />

      {/* ── Processed frame from backend (landmark points mask overlay) ──
           Shown on top of raw feed when backend sends it back.
           Falls back to raw webcam if backend is in mock mode / cv2 unavailable. */}
      {processedImage && (
        <img
          src={processedImage}
          alt="Processed feed with landmark points"
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {/* Connection Indicator */}
      <div className="absolute top-3 right-3 flex items-center gap-2 bg-slate-900/80 backdrop-blur border border-slate-800 rounded-full px-3 py-1 shadow-md">
        <span
          className={`h-2 w-2 rounded-full ${
            status === "connected"
              ? "bg-emerald-400 animate-pulse"
              : status === "connecting"
              ? "bg-amber-400 animate-pulse"
              : "bg-rose-500"
          }`}
        />
        <span className="text-white text-xs font-mono font-semibold uppercase">{status}</span>
      </div>

      {/* AI status badge */}
      <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur border border-slate-800 rounded-lg px-2.5 py-1 text-[10px] font-mono font-semibold shadow-md flex items-center gap-1.5">
        <span className={`w-1.5 h-1.5 rounded-full ${processedImage ? "bg-emerald-400 animate-ping" : "bg-amber-400"}`} />
        <span className={processedImage ? "text-emerald-400" : "text-amber-400"}>
          {processedImage ? "AI LANDMARK ACTIVE" : "RAW FEED"}
        </span>
      </div>

      {/* Telemetry HUD Overlay */}
      {status === "connected" && (
        <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-slate-950/90 via-slate-950/60 to-transparent flex flex-col gap-3">
          {/* Active Gesture Banner */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Active Gesture State</span>
              <p className="text-sm font-bold text-white mt-0.5">{getGestureLabel(activeGesture)}</p>
            </div>
            {activeGesture !== "resting" && (
              <div className="flex items-center gap-2 bg-brand-500/20 border border-brand-500/30 rounded-lg px-2 py-0.5 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                <span className="text-xs font-semibold text-brand-300">Capturing: {Math.round(progress * 100)}%</span>
              </div>
            )}
          </div>

          {/* Progress Bar for Sustained Gesture */}
          {activeGesture !== "resting" && (
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-500 transition-all duration-150 rounded-full shadow-glow"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          )}

          {/* EAR & MAR Telemetry meters */}
          <div className="grid grid-cols-2 gap-4 pt-1">
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-mono font-semibold text-slate-400">
                <span>Eye Ratio (EAR)</span>
                <span>{ear.toFixed(2)}</span>
              </div>
              <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-sky-500 rounded-full transition-all duration-150"
                  style={{ width: `${Math.min(100, ear * 250)}%` }}
                />
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-mono font-semibold text-slate-400">
                <span>Mouth Ratio (MAR)</span>
                <span>{mar.toFixed(2)}</span>
              </div>
              <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-violet-500 rounded-full transition-all duration-150"
                  style={{ width: `${Math.min(100, mar * 125)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CameraFeed;

