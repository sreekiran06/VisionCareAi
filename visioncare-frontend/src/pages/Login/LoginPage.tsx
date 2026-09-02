import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "../../services/api";
import { Eye, EyeOff, Activity, Lock, Mail, ArrowRight, Shield, Zap } from "lucide-react";

const ADMIN_ROLES = ["super_admin", "hospital_admin"];

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("nurse@visioncare.com");
  const [password, setPassword] = useState("password123");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      // 1. Get token
      const res = await authApi.login(email, password);
      const token = res.data.access_token;
      localStorage.setItem("vc_access_token", token);

      // 2. Fetch user profile to determine role
      const meRes = await authApi.me();
      const user = meRes.data;

      // 3. Persist user info
      if (user.id)      localStorage.setItem("vc_nurse_id",   String(user.id));
      if (user.name)    localStorage.setItem("vc_nurse_name", user.name);
      if (user.ward_id) localStorage.setItem("vc_ward_id",    user.ward_id);
      if (user.role)    localStorage.setItem("vc_role",       user.role);

      // 4. Role-based redirect
      if (ADMIN_ROLES.includes(user.role)) {
        navigate("/admin", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    } catch {
      setError("Invalid email or password. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-950 flex items-center justify-center p-6">
      {/* Ambient background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-signal-teal/15 rounded-full blur-3xl animate-float" style={{ animationDelay: "3s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-600/5 rounded-full blur-3xl" />
        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      <div className="relative w-full max-w-md animate-scale-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-signal-teal shadow-glow mb-4">
            <Activity size={28} className="text-white" />
          </div>
          <h1 className="text-3xl font-display font-bold text-white mb-2">
            VisionCare AI
          </h1>
          <p className="text-slate-400 text-sm">
            AI-Powered Patient Monitoring Platform
          </p>
        </div>

        {/* Feature pills */}
        <div className="flex items-center justify-center gap-3 mb-8 flex-wrap">
          {[
            { icon: <Shield size={12} />, label: "HIPAA Secure" },
            { icon: <Zap size={12} />,   label: "Real-time AI" },
            { icon: <Eye size={12} />,   label: "Computer Vision" },
          ].map((f) => (
            <span key={f.label} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-400 text-xs font-medium">
              {f.icon} {f.label}
            </span>
          ))}
        </div>

        {/* Card */}
        <div className="glass rounded-3xl p-8 shadow-glass border border-white/10">
          <h2 className="text-xl font-display font-semibold text-white mb-1">Sign in to your account</h2>
          <p className="text-slate-400 text-sm mb-6">Enter your credentials to access the dashboard</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="label text-slate-400" htmlFor="login-email">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                <input
                  id="login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500/60 transition-all duration-200"
                  placeholder="nurse@hospital.org"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="label text-slate-400" htmlFor="login-password">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-12 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500/60 transition-all duration-200"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm animate-slide-up">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                {error}
              </div>
            )}

            {/* Default creds hint */}
            <div className="p-3 bg-brand-500/10 border border-brand-500/20 rounded-xl text-brand-300 text-xs space-y-1">
              <p><span className="font-semibold">Nurse:</span> nurse@visioncare.com / password123</p>
              <p><span className="font-semibold">Admin:</span> admin@visioncare.com / admin123</p>
            </div>

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-6 bg-gradient-to-r from-brand-500 to-signal-teal text-white font-semibold rounded-xl shadow-lg hover:shadow-glow hover:opacity-95 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 active:scale-[0.98]"
            >
              {submitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-slate-600 text-xs mt-6">
          Powered by Computer Vision AI · Secure Healthcare Platform
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
