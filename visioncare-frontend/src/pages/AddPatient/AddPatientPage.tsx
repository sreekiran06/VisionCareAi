import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { patientsApi } from "../../services/api";
import { UserPlus, ArrowLeft, CheckCircle, Upload } from "lucide-react";

const CONDITIONS = [
  { value: "stroke",       label: "Stroke"       },
  { value: "als",          label: "ALS"           },
  { value: "paralysis",    label: "Paralysis"     },
  { value: "post_surgery", label: "Post Surgery"  },
  { value: "elderly",      label: "Elderly"       },
  { value: "other",        label: "Other"         },
];

const WARDS = ["ICU-1", "ICU-2", "Ward-A", "Ward-B", "Ward-C", "Emergency"];

export const AddPatientPage: React.FC = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [success,    setSuccess]    = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  const [form, setForm] = useState({
    name:           "",
    age:            "",
    gender:         "male",
    bed_number:     "",
    ward_id:        "ICU-1",
    hospital_id:    "HOSP-1",
    condition:      "stroke",
    notes:          "",
    doctor:         "",
    phone:          "",
    emergency_contact: "",
    blood_group:    "O+",
    enable_monitoring: true,
  });

  const set = (field: string, value: string | boolean) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.age || !form.bed_number) {
      setError("Please fill in all required fields.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await patientsApi.create({
        name:        form.name,
        age:         parseInt(form.age, 10),
        bed_number:  form.bed_number,
        ward_id:     form.ward_id,
        hospital_id: form.hospital_id,
        condition:   form.condition,
        notes:       form.notes || "",
      });
      setSuccess(true);
      setTimeout(() => navigate("/patients"), 2000);
    } catch {
      setError("Failed to register patient. Check all required fields and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh] animate-fade-in">
        <div className="text-center">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-emerald-500" />
          </div>
          <h2 className="text-xl font-display font-bold text-slate-900 dark:text-slate-100 mb-2">Patient Registered!</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Redirecting to patients list…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/patients")}
          className="btn-ghost"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-slate-100">Add Patient</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Register a new patient for monitoring</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-2xl text-rose-700 dark:text-rose-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <div className="card p-6">
          <h3 className="font-display font-semibold text-slate-900 dark:text-slate-100 mb-5 flex items-center gap-2">
            <UserPlus size={18} className="text-brand-500" />
            Personal Information
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <div className="sm:col-span-2 lg:col-span-1">
              <label className="label" htmlFor="patient-name">Full Name *</label>
              <input
                id="patient-name"
                type="text"
                required
                placeholder="e.g. John Doe"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="label" htmlFor="patient-age">Age *</label>
              <input
                id="patient-age"
                type="number"
                required
                min={1}
                max={120}
                placeholder="e.g. 65"
                value={form.age}
                onChange={(e) => set("age", e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="label" htmlFor="patient-gender">Gender</label>
              <select id="patient-gender" value={form.gender} onChange={(e) => set("gender", e.target.value)} className="select-field">
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="patient-blood">Blood Group</label>
              <select id="patient-blood" value={form.blood_group} onChange={(e) => set("blood_group", e.target.value)} className="select-field">
                {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="patient-phone">Phone Number</label>
              <input
                id="patient-phone"
                type="tel"
                placeholder="+1 (555) 000-0000"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="label" htmlFor="patient-emergency">Emergency Contact</label>
              <input
                id="patient-emergency"
                type="tel"
                placeholder="+1 (555) 000-0001"
                value={form.emergency_contact}
                onChange={(e) => set("emergency_contact", e.target.value)}
                className="input-field"
              />
            </div>
          </div>
        </div>

        {/* Ward & Medical */}
        <div className="card p-6">
          <h3 className="font-display font-semibold text-slate-900 dark:text-slate-100 mb-5 flex items-center gap-2">
            <span className="w-5 h-5 rounded bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 text-xs">🏥</span>
            Ward & Medical Information
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <div>
              <label className="label" htmlFor="patient-bed">Bed / Room Number *</label>
              <input
                id="patient-bed"
                type="text"
                required
                placeholder="e.g. 102A"
                value={form.bed_number}
                onChange={(e) => set("bed_number", e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="label" htmlFor="patient-ward">Ward</label>
              <select id="patient-ward" value={form.ward_id} onChange={(e) => set("ward_id", e.target.value)} className="select-field">
                {WARDS.map((w) => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="patient-doctor">Assigned Doctor</label>
              <input
                id="patient-doctor"
                type="text"
                placeholder="Dr. Smith"
                value={form.doctor}
                onChange={(e) => set("doctor", e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="label" htmlFor="patient-condition">Medical Condition *</label>
              <select id="patient-condition" value={form.condition} onChange={(e) => set("condition", e.target.value)} className="select-field">
                {CONDITIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2 lg:col-span-2">
              <label className="label" htmlFor="patient-notes">Notes</label>
              <textarea
                id="patient-notes"
                rows={3}
                placeholder="Additional clinical notes, allergies, special requirements…"
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                className="input-field resize-none"
              />
            </div>
          </div>
        </div>

        {/* Camera & Monitoring */}
        <div className="card p-6">
          <h3 className="font-display font-semibold text-slate-900 dark:text-slate-100 mb-5 flex items-center gap-2">
            <span className="w-5 h-5 rounded bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 text-xs">📷</span>
            Camera & Monitoring
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="label">Patient Photo (optional)</label>
              <label className="flex items-center gap-3 p-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer hover:border-brand-400 dark:hover:border-brand-600 transition-colors group">
                <Upload size={20} className="text-slate-400 group-hover:text-brand-500 transition-colors" />
                <span className="text-sm text-slate-400 group-hover:text-brand-500 transition-colors">Click to upload photo</span>
                <input type="file" accept="image/*" className="hidden" />
              </label>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <label className="label">Camera Assignment</label>
                <select className="select-field">
                  <option>Auto-assign</option>
                  <option>Camera 01</option>
                  <option>Camera 02</option>
                  <option>Camera 03</option>
                </select>
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${form.enable_monitoring ? "bg-brand-500" : "bg-slate-300 dark:bg-slate-600"}`}
                  onClick={() => set("enable_monitoring", !form.enable_monitoring)}
                >
                  <div
                    className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${form.enable_monitoring ? "translate-x-6" : "translate-x-0"}`}
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Enable Monitoring</p>
                  <p className="text-xs text-slate-400">Start AI-powered camera monitoring on registration</p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            id="add-patient-submit"
            disabled={submitting}
            className="btn-primary px-8 py-3 text-base"
          >
            {submitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Registering…
              </>
            ) : (
              <>
                <UserPlus size={18} />
                Register Patient
              </>
            )}
          </button>
          <button type="button" onClick={() => navigate("/patients")} className="btn-secondary px-6 py-3">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddPatientPage;
