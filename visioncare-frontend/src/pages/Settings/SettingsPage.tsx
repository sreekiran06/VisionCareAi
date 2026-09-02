import React, { useState } from "react";
import {
  Settings,
  Eye,
  Activity,
  Sliders,
  Mail,
  MessageSquare,
  Camera,
  User,
  Shield,
  Save,
  CheckCircle,
} from "lucide-react";

export const SettingsPage: React.FC = () => {
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Default initial configuration states
  const [earThreshold, setEarThreshold] = useState(0.21);
  const [marThreshold, setMarThreshold] = useState(0.60);
  const [consecFrames, setConsecFrames] = useState(15);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [cameraFps, setCameraFps] = useState(30);
  const [cameraRes, setCameraRes] = useState("720p");
  const [nurseName, setNurseName] = useState(localStorage.getItem("vc_nurse_name") ?? "Nurse");
  const [nurseEmail, setNurseEmail] = useState("nurse@visioncare.com");

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccess(false);

    // Save user profile state
    localStorage.setItem("vc_nurse_name", nurseName);

    setTimeout(() => {
      setSubmitting(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }, 1000);
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in text-slate-900 dark:text-slate-100 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-slate-100">Settings</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">System threshold configuration and user options</p>
        </div>
      </div>

      {success && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-emerald-700 dark:text-emerald-400 text-sm animate-slide-up">
          <CheckCircle size={16} className="shrink-0 text-emerald-500" />
          Settings updated successfully!
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Core CV Detection Thresholds */}
        <div className="card p-6">
          <h3 className="font-display font-semibold text-slate-900 dark:text-slate-100 mb-5 flex items-center gap-2">
            <Sliders size={18} className="text-brand-500" />
            Computer Vision Detection Thresholds
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className="label" htmlFor="ear-thresh">Eye Aspect Ratio (EAR) *</label>
              <div className="relative">
                <input
                  id="ear-thresh"
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  required
                  value={earThreshold}
                  onChange={(e) => setEarThreshold(parseFloat(e.target.value))}
                  className="input-field"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-semibold pointer-events-none">
                  Ratio
                </span>
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                Lower value means eyes must be more closed to trigger alert.
              </p>
            </div>

            <div>
              <label className="label" htmlFor="mar-thresh">Mouth Aspect Ratio (MAR) *</label>
              <div className="relative">
                <input
                  id="mar-thresh"
                  type="number"
                  step="0.01"
                  min="0"
                  max="2"
                  required
                  value={marThreshold}
                  onChange={(e) => setMarThreshold(parseFloat(e.target.value))}
                  className="input-field"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-semibold pointer-events-none">
                  Ratio
                </span>
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                Higher value means mouth must be wider open to trigger alert.
              </p>
            </div>

            <div>
              <label className="label" htmlFor="consec-frames">Consecutive Frames *</label>
              <div className="relative">
                <input
                  id="consec-frames"
                  type="number"
                  required
                  min="1"
                  value={consecFrames}
                  onChange={(e) => setConsecFrames(parseInt(e.target.value, 10))}
                  className="input-field"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-semibold pointer-events-none">
                  Frames
                </span>
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                Number of continuous frames event must persist to trigger alarm.
              </p>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="card p-6">
          <h3 className="font-display font-semibold text-slate-900 dark:text-slate-100 mb-5 flex items-center gap-2">
            <Mail size={18} className="text-violet-500" />
            Alert Escalation Notifications
          </h3>
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${emailAlerts ? "bg-brand-500" : "bg-slate-300 dark:bg-slate-600"}`}
                onClick={() => setEmailAlerts(!emailAlerts)}
              >
                <div
                  className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${emailAlerts ? "translate-x-6" : "translate-x-0"}`}
                />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Email Notifications</p>
                <p className="text-xs text-slate-400">Escalate high-confidence critical events to staff emails</p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <div
                className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${smsAlerts ? "bg-brand-500" : "bg-slate-300 dark:bg-slate-600"}`}
                onClick={() => setSmsAlerts(!smsAlerts)}
              >
                <div
                  className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${smsAlerts ? "translate-x-6" : "translate-x-0"}`}
                />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">SMS / Twilio Notifications</p>
                <p className="text-xs text-slate-400">Send emergency paging SMS alerts to emergency dispatch phone numbers</p>
              </div>
            </label>
          </div>
        </div>

        {/* Camera / Streaming Settings */}
        <div className="card p-6">
          <h3 className="font-display font-semibold text-slate-900 dark:text-slate-100 mb-5 flex items-center gap-2">
            <Camera size={18} className="text-emerald-500" />
            Bedside Camera Settings
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="label" htmlFor="cam-fps">Target Frame Rate</label>
              <select id="cam-fps" value={cameraFps} onChange={(e) => setCameraFps(parseInt(e.target.value, 10))} className="select-field">
                <option value="15">15 FPS (Resource Optimized)</option>
                <option value="30">30 FPS (Standard)</option>
                <option value="60">60 FPS (Ultra Smooth)</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="cam-res">Resolution</label>
              <select id="cam-res" value={cameraRes} onChange={(e) => setCameraRes(e.target.value)} className="select-field">
                <option value="480p">480p (Standard Definition)</option>
                <option value="720p">720p (High Definition)</option>
                <option value="1080p">1080p (Full HD)</option>
              </select>
            </div>
          </div>
        </div>

        {/* User profile */}
        <div className="card p-6">
          <h3 className="font-display font-semibold text-slate-900 dark:text-slate-100 mb-5 flex items-center gap-2">
            <User size={18} className="text-amber-500" />
            User Profile
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="label" htmlFor="nurse-display-name">Display Name</label>
              <input
                id="nurse-display-name"
                type="text"
                required
                value={nurseName}
                onChange={(e) => setNurseName(e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="label" htmlFor="nurse-email-display">Email Address</label>
              <input
                id="nurse-email-display"
                type="email"
                required
                value={nurseEmail}
                onChange={(e) => setNurseEmail(e.target.value)}
                className="input-field"
              />
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            id="settings-save-submit"
            disabled={submitting}
            className="btn-primary px-8 py-3 text-base"
          >
            {submitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Save size={18} />
                Save Settings
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SettingsPage;
