import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { gestureMappingsApi, patientsApi } from "../../services/api";
import { GestureType, NeedType, Patient } from "../../types";

const GESTURE_LABELS: Record<GestureType, string> = {
  double_blink: "Blink twice",
  sustained_close: "Close eyes for 3 seconds",
  smile: "Smile",
  eyebrow_raise: "Raise eyebrows",
  head_left: "Turn head left",
  head_right: "Turn head right",
  mouth_open: "Open mouth",
};

const NEED_OPTIONS: { value: NeedType; label: string }[] = [
  { value: "water", label: "Water" },
  { value: "food", label: "Food" },
  { value: "nurse", label: "Need nurse" },
  { value: "pain", label: "Pain" },
  { value: "washroom", label: "Washroom" },
  { value: "emergency", label: "Emergency" },
];

export const PatientSetupPage: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [mapping, setMapping] = useState<Partial<Record<GestureType, NeedType>>>(
    {}
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!patientId) return;
    (async () => {
      try {
        const res = await patientsApi.get(patientId);
        setPatient(res.data);
      } catch {
        setError("Could not load patient details.");
      }
    })();
  }, [patientId]);

  const handleSaveAll = async () => {
    if (!patientId) return;
    setSaving(true);
    setError(null);
    try {
      const entries = Object.entries(mapping) as [GestureType, NeedType][];
      await Promise.all(
        entries.map(([gesture, need]) =>
          gestureMappingsApi.set(patientId, gesture, need)
        )
      );
      navigate(`/dashboard`);
    } catch {
      setError("Failed to save one or more gesture mappings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-signal-mist p-6">
      <div className="max-w-2xl mx-auto">
        <header className="mb-8">
          <h1 className="text-2xl font-display font-bold text-ink-900">
            Set up gesture mapping
          </h1>
          <p className="text-gray-600 mt-1">
            {patient
              ? `Choose what each gesture means for ${patient.name}.`
              : "Loading patient…"}
          </p>
        </header>

        <div className="bg-white rounded-xl shadow-card divide-y divide-gray-100">
          {(Object.keys(GESTURE_LABELS) as GestureType[]).map((gesture) => (
            <div key={gesture} className="flex items-center justify-between p-5">
              <span className="text-ink-900 font-medium">
                {GESTURE_LABELS[gesture]}
              </span>
              <select
                value={mapping[gesture] ?? ""}
                onChange={(e) =>
                  setMapping((prev) => ({
                    ...prev,
                    [gesture]: e.target.value as NeedType,
                  }))
                }
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-ink-800
                           focus:border-signal-teal focus:ring-1 focus:ring-signal-teal"
              >
                <option value="">Not mapped</option>
                {NEED_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>

        {error && (
          <div className="mt-4 p-4 bg-signal-coral/10 border border-signal-coral/30 rounded-lg text-signal-coral text-sm">
            {error}
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSaveAll}
            disabled={saving || Object.keys(mapping).length === 0}
            className="py-3 px-6 bg-signal-teal text-white rounded-lg font-medium
                       hover:bg-signal-teal/90 disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors"
          >
            {saving ? "Saving…" : "Save and go to dashboard"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PatientSetupPage;
