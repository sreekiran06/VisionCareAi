import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';
import { AdminTopBar } from './AdminTopBar';
import { ToastStack } from '../ui/Toast';
import { useToast } from '../../hooks/useToast';
import { useAdminWebSocket } from '../../hooks/useAdminWebSocket';

interface AdminShellProps {
  children: React.ReactNode;
}

export const AdminShell: React.FC<AdminShellProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const toast = useToast();

  // Apply dark class on root
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  const { isConnected } = useAdminWebSocket({
    onMessage: (event) => {
      if (event.type === 'new_alert') {
        toast.warning('New Alert', String(event.payload?.alert_type ?? 'Alert triggered'));
      }
    },
  });

  // Read stored user info
  const token = localStorage.getItem('vc_access_token');
  const role  = localStorage.getItem('vc_role') ?? '';
  const name  = localStorage.getItem('vc_nurse_name') ?? 'Admin';

  // Protect admin routes
  if (!token) return <Navigate to="/login" replace />;
  if (!['super_admin', 'hospital_admin'].includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className={`min-h-screen flex ${isDark ? 'dark bg-slate-950' : 'bg-slate-100'}`}>
      <AdminSidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />

      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300
          ${collapsed ? 'ml-16' : 'ml-64'}`}
      >
        <AdminTopBar
          sidebarCollapsed={collapsed}
          isDark={isDark}
          onThemeToggle={() => setIsDark((d) => !d)}
          wsConnected={isConnected}
          adminName={name}
          adminRole={role}
        />

        <main className="flex-1 pt-16 p-6 overflow-auto">
          {children}
        </main>
      </div>

      <ToastStack toasts={toast.toasts} dismiss={toast.dismiss} />
    </div>
  );
};
