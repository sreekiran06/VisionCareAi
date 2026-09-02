import React, { useCallback, useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import { useNavigate, useParams } from "react-router-dom";
import { calibrationApi } from "../../services/api";
import { CalibrationSession, GestureType } from "../../types";

const SAMPLES_REQUIRED = 3;
const COUNTDOWN_SECONDS = 3;
const CAPTURE_FRAMES = 30;
const FRAME_INTERVAL_MS = 33; // ~30fps

type CaptureStatus = "idle" | "countdown" | "capturing" | "processing";

export const CalibrationPage: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const webcamRef = useRef<Webcam>(null);

  const [session, setSession] = useState<CalibrationSession | null>(null);
  const [currentGestureIndex, setCurrentGestureIndex] = useState(0);
  const [sampleCount, setSampleCount] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [status, setStatus] = useState<CaptureStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!patientId) return;
    let cancelled = false;

    (async () => {
      try {
        const response = await calibrationApi.start(patientId);
        if (!cancelled) setSession(response.data);
      } catch {
        if (!cancelled) setError("Failed to start the calibration session.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [patientId]);

  const currentGesture = session?.gesturesToCalibrate[
    currentGestureIndex
  ] as GestureType | undefined;
  const instructions = currentGesture
    ? session?.instructions[currentGesture]
    : undefined;

  const captureFrames = useCallback(async () => {
    if (!webcamRef.current || !currentGesture || !patientId) return;

    setStatus("capturing");
    const frames: string[] = [];

    for (let i = 0; i < CAPTURE_FRAMES; i++) {
      const frame = webcamRef.current.getScreenshot();
      if (frame) frames.push(frame);
      // eslint-disable-next-line no-await-in-loop
      await new Promise((resolve) => setTimeout(resolve, FRAME_INTERVAL_MS));
    }

    setStatus("processing");

    try {
      await calibrationApi.saveSample(patientId, {
        gesture_type: currentGesture,
        frames,
        sample_index: sampleCount,
      });

      const nextSampleCount = sampleCount + 1;
      setSampleCount(nextSampleCount);

      if (nextSampleCount >= SAMPLES_REQUIRED) {
        const nextGestureIndex = currentGestureIndex + 1;
        if (nextGestureIndex < (session?.gesturesToCalibrate.length ?? 0)) {
          setCurrentGestureIndex(nextGestureIndex);
          setSampleCount(0);
        } else {
          await calibrationApi.complete(patientId);
          navigate(`/patients/${patientId}/setup-mappings`);
          return;
        }
      }
    } catch {
      setError("Failed to save that sample. Please try again.");
    }

    setStatus("idle");
  }, [currentGesture, currentGestureIndex, patientId, sampleCount, session, navigate]);

  const startCapture = () => {
    setStatus("countdown");
    setCountdown(COUNTDOWN_SECONDS);
  };

  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      captureFrames();
      setCountdown(null);
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => (c ?? 1) - 1), 1000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdown]);

  const skipGesture = () => {
    const nextGestureIndex = currentGestureIndex + 1;
    if (nextGestureIndex < (session?.gesturesToCalibrate.length ?? 0)) {
      setCurrentGestureIndex(nextGestureIndex);
      setSampleCount(0);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-signal-mist">
        <div
          className="animate-spin rounded-full h-10 w-10 border-2 border-signal-teal border-t-transparent"
          role="status"
          aria-label="Loading calibration session"
        />
      </div>
    );
  }

  const progressPct = (sampleCount / SAMPLES_REQUIRED) * 100;

  return (
    <div className="min-h-screen bg-signal-mist p-6">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-2xl font-display font-bold text-ink-900">
            Calibrating: {session.patientName}
          </h1>
          <p className="text-gray-600 mt-1">
            Gesture {currentGestureIndex + 1} of {session.gesturesToCalibrate.length}
          </p>
        </header>

        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>{instructions?.title}</span>
            <span>
              {sampleCount} / {SAMPLES_REQUIRED} samples
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-signal-teal transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="relative">
            <div className="aspect-video bg-ink-950 rounded-xl overflow-hidden relative">
              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                className="w-full h-full object-cover"
                mirrored
              />

              {status === "countdown" && countdown !== null && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="text-8xl font-display font-bold text-white animate-pulse">
                    {countdown}
                  </span>
                </div>
              )}

              {status === "capturing" && (
                <div className="absolute inset-0 border-4 border-signal-coral">
                  <div className="absolute top-4 right-4 flex items-center gap-2">
                    <span className="h-3 w-3 bg-signal-coral rounded-full animate-pulse" />
                    <span className="text-white font-medium">Recording</span>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 flex gap-4">
              <button
                onClick={startCapture}
                disabled={status !== "idle"}
                className="flex-1 py-3 px-6 bg-signal-teal text-white rounded-lg font-medium
                           hover:bg-signal-teal/90 disabled:opacity-50 disabled:cursor-not-allowed
                           transition-colors"
              >
                {status === "idle" && "Capture sample"}
                {status === "countdown" && `Starting in ${countdown}...`}
                {status === "capturing" && "Capturing..."}
                {status === "processing" && "Processing..."}
              </button>

              <button
                onClick={skipGesture}
                className="py-3 px-6 bg-gray-200 text-gray-700 rounded-lg font-medium
                           hover:bg-gray-300 transition-colors"
              >
                Skip gesture
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-card p-6">
            <h2 className="text-xl font-display font-semibold text-ink-900 mb-4">
              {instructions?.title}
            </h2>

            <p className="text-gray-600 mb-6">{instructions?.instruction}</p>

            {instructions?.demoVideo && (
              <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden mb-6">
                <video
                  src={instructions.demoVideo}
                  autoPlay
                  loop
                  muted
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="bg-signal-teal/5 rounded-lg p-4">
              <h3 className="font-medium text-ink-900 mb-2">Tips</h3>
              <ul className="text-sm text-ink-700 space-y-1">
                <li>• Keep the patient's face well-lit and clearly visible</li>
                <li>• Perform the gesture naturally, the way it will be used day to day</li>
                <li>• Hold the gesture until the recording completes</li>
                <li>• Slight variation between samples improves accuracy</li>
              </ul>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-6 p-4 bg-signal-coral/10 border border-signal-coral/30 rounded-lg">
            <p className="text-signal-coral text-sm">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-signal-coral underline text-sm mt-2"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CalibrationPage;
