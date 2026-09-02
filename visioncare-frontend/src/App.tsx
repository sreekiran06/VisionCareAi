import React, { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

// ── Nurse / existing pages ──────────────────────────────────────────────────
import { NurseDashboard } from "./components/Dashboard/NurseDashboard";
import { CalibrationPage } from "./pages/Calibration/CalibrationPage";
import { PatientSetupPage } from "./pages/PatientSetup/PatientSetupPage";
import { LoginPage } from "./pages/Login/LoginPage";
import { BedsidePage } from "./pages/Bedside/BedsidePage";
import { PatientsPage } from "./pages/Patients/PatientsPage";
import { AddPatientPage } from "./pages/AddPatient/AddPatientPage";
import { DetectionsPage } from "./pages/Detections/DetectionsPage";
import { AlertsPage } from "./pages/Alerts/AlertsPage";
import { AnalyticsPage } from "./pages/Analytics/AnalyticsPage";
import { SettingsPage } from "./pages/Settings/SettingsPage";
import { MonitoringPage } from "./pages/Monitoring/MonitoringPage";
import { AppShell } from "./components/Layout/AppShell";
import { authApi } from "./services/api";

// ── Admin module ─────────────────────────────────────────────────────────────
import { AdminShell } from "./admin/components/layout/AdminShell";
import { AdminDashboardPage } from "./admin/pages/AdminDashboardPage";
import { HospitalsPage } from "./admin/pages/HospitalsPage";
import { UsersPage } from "./admin/pages/UsersPage";
import { CamerasPage } from "./admin/pages/CamerasPage";
import { PatientsAdminPage } from "./admin/pages/PatientsAdminPage";
import { AlertsAdminPage } from "./admin/pages/AlertsAdminPage";
import { MonitoringPage as AdminMonitoringPage } from "./admin/pages/MonitoringPage";
import { AnalyticsPage as AdminAnalyticsPage } from "./admin/pages/AnalyticsPage";
import { AuditLogsPage } from "./admin/pages/AuditLogsPage";
import { NotificationsPage } from "./admin/pages/NotificationsPage";
import { SubscriptionsPage } from "./admin/pages/SubscriptionsPage";
import { HierarchyPage } from "./admin/pages/HierarchyPage";

const ADMIN_ROLES = ["super_admin", "hospital_admin"];

// ── Auth guards ───────────────────────────────────────────────────────────────
function RequireAuth({ children }: { children: React.ReactElement }) {
  const token = localStorage.getItem("vc_access_token");
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function RequireAdminAuth({ children }: { children: React.ReactElement }) {
  const token = localStorage.getItem("vc_access_token");
  const role  = localStorage.getItem("vc_role") ?? "";
  if (!token) return <Navigate to="/login" replace />;
  if (!ADMIN_ROLES.includes(role)) return <Navigate to="/dashboard" replace />;
  return children;
}

function RoleRedirect() {
  const role = localStorage.getItem("vc_role") ?? "";
  return ADMIN_ROLES.includes(role)
    ? <Navigate to="/admin" replace />
    : <Navigate to="/dashboard" replace />;
}

// ── App ───────────────────────────────────────────────────────────────────────
function App() {
  const [wardId, setWardId]       = useState(localStorage.getItem("vc_ward_id")    ?? "ICU-1");
  const [nurseId, setNurseId]     = useState(localStorage.getItem("vc_nurse_id")   ?? "nurse-1");
  const [nurseName, setNurseName] = useState(localStorage.getItem("vc_nurse_name") ?? "Nurse");

  useEffect(() => {
    const token = localStorage.getItem("vc_access_token");
    if (!token) return;
    authApi.me().then((res) => {
      const user = res.data;
      if (user.ward_id) { setWardId(user.ward_id);   localStorage.setItem("vc_ward_id",    user.ward_id); }
      if (user.id)      { setNurseId(String(user.id)); localStorage.setItem("vc_nurse_id",   String(user.id)); }
      if (user.name)    { setNurseName(user.name);    localStorage.setItem("vc_nurse_name", user.name); }
      if ((user as any).role) localStorage.setItem("vc_role", (user as any).role);
    }).catch(() => {
      localStorage.removeItem("vc_access_token");
    });
  }, []);

  return (
    <BrowserRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />

        {/* Root — redirect based on role */}
        <Route path="/" element={<RequireAuth><RoleRedirect /></RequireAuth>} />

        {/* ── Nurse routes (AppShell) ─────────────────────────────────────── */}
        <Route path="/dashboard" element={
          <RequireAuth>
            <AppShell nurseName={nurseName} wardId={wardId}>
              <NurseDashboard wardId={wardId} nurseId={nurseId} nurseName={nurseName} />
            </AppShell>
          </RequireAuth>
        } />
        <Route path="/monitoring" element={
          <RequireAuth>
            <AppShell nurseName={nurseName} wardId={wardId}><MonitoringPage /></AppShell>
          </RequireAuth>
        } />
        <Route path="/patients" element={
          <RequireAuth>
            <AppShell nurseName={nurseName} wardId={wardId}><PatientsPage /></AppShell>
          </RequireAuth>
        } />
        <Route path="/add-patient" element={
          <RequireAuth>
            <AppShell nurseName={nurseName} wardId={wardId}><AddPatientPage /></AppShell>
          </RequireAuth>
        } />
        <Route path="/detections" element={
          <RequireAuth>
            <AppShell nurseName={nurseName} wardId={wardId}><DetectionsPage /></AppShell>
          </RequireAuth>
        } />
        <Route path="/alerts" element={
          <RequireAuth>
            <AppShell nurseName={nurseName} wardId={wardId}><AlertsPage /></AppShell>
          </RequireAuth>
        } />
        <Route path="/analytics" element={
          <RequireAuth>
            <AppShell nurseName={nurseName} wardId={wardId}><AnalyticsPage /></AppShell>
          </RequireAuth>
        } />
        <Route path="/settings" element={
          <RequireAuth>
            <AppShell nurseName={nurseName} wardId={wardId}><SettingsPage /></AppShell>
          </RequireAuth>
        } />

        {/* Bedside (no shell) */}
        <Route path="/patients/:patientId/monitor" element={
          <RequireAuth><BedsidePage /></RequireAuth>
        } />
        <Route path="/patients/:patientId/calibration" element={
          <RequireAuth><CalibrationPage /></RequireAuth>
        } />
        <Route path="/patients/:patientId/setup-mappings" element={
          <RequireAuth><PatientSetupPage /></RequireAuth>
        } />

        {/* ── Admin routes (AdminShell) ───────────────────────────────────── */}
        <Route path="/admin" element={
          <RequireAdminAuth>
            <AdminShell><AdminDashboardPage /></AdminShell>
          </RequireAdminAuth>
        } />
        <Route path="/admin/hospitals" element={
          <RequireAdminAuth>
            <AdminShell><HospitalsPage /></AdminShell>
          </RequireAdminAuth>
        } />
        <Route path="/admin/users" element={
          <RequireAdminAuth>
            <AdminShell><UsersPage /></AdminShell>
          </RequireAdminAuth>
        } />
        <Route path="/admin/cameras" element={
          <RequireAdminAuth>
            <AdminShell><CamerasPage /></AdminShell>
          </RequireAdminAuth>
        } />
        <Route path="/admin/patients" element={
          <RequireAdminAuth>
            <AdminShell><PatientsAdminPage /></AdminShell>
          </RequireAdminAuth>
        } />
        <Route path="/admin/alerts" element={
          <RequireAdminAuth>
            <AdminShell><AlertsAdminPage /></AdminShell>
          </RequireAdminAuth>
        } />
        <Route path="/admin/monitoring" element={
          <RequireAdminAuth>
            <AdminShell><AdminMonitoringPage /></AdminShell>
          </RequireAdminAuth>
        } />
        <Route path="/admin/analytics" element={
          <RequireAdminAuth>
            <AdminShell><AdminAnalyticsPage /></AdminShell>
          </RequireAdminAuth>
        } />
        <Route path="/admin/audit" element={
          <RequireAdminAuth>
            <AdminShell><AuditLogsPage /></AdminShell>
          </RequireAdminAuth>
        } />
        <Route path="/admin/notifications" element={
          <RequireAdminAuth>
            <AdminShell><NotificationsPage /></AdminShell>
          </RequireAdminAuth>
        } />
        <Route path="/admin/subscriptions" element={
          <RequireAdminAuth>
            <AdminShell><SubscriptionsPage /></AdminShell>
          </RequireAdminAuth>
        } />
        <Route path="/admin/hierarchy" element={
          <RequireAdminAuth>
            <AdminShell><HierarchyPage /></AdminShell>
          </RequireAdminAuth>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

