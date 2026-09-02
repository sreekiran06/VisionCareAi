import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Video,
  Users,
  UserPlus,
  Activity,
  Bell,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Eye,
  Sun,
  Moon,
} from "lucide-react";

interface NavItem {
  label: string;
  icon: React.ReactNode;
  path: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard",         icon: <LayoutDashboard size={18} />, path: "/dashboard"  },
  { label: "Live Monitoring",   icon: <Video           size={18} />, path: "/monitoring" },
  { label: "Patients",          icon: <Users           size={18} />, path: "/patients"   },
  { label: "Add Patient",       icon: <UserPlus        size={18} />, path: "/add-patient"},
  { label: "Detections",        icon: <Activity        size={18} />, path: "/detections" },
  { label: "Alerts",            icon: <Bell            size={18} />, path: "/alerts"     },
  { label: "Analytics",         icon: <BarChart3       size={18} />, path: "/analytics"  },
  { label: "Settings",          icon: <Settings        size={18} />, path: "/settings"   },
];

interface SidebarProps {
  nurseName?: string;
  wardId?: string;
  dark: boolean;
  onToggleDark: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  nurseName = "Nurse",
  wardId = "ICU-1",
  dark,
  onToggleDark,
}) => {
  const location = useLocation();
  const navigate  = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <aside
      className={`
        relative flex flex-col h-screen bg-slate-950 border-r border-slate-800
        transition-all duration-300 ease-in-out shrink-0
        ${collapsed ? "w-16" : "w-60"}
      `}
    >
      {/* Top: Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-800 overflow-hidden">
        <div className="shrink-0 w-9 h-9 bg-gradient-to-br from-brand-400 to-signal-teal rounded-xl flex items-center justify-center shadow-glow">
          <Eye size={18} className="text-white" />
        </div>
        {!collapsed && (
          <div className="animate-fade-in overflow-hidden">
            <p className="text-white font-display font-bold text-sm leading-tight">VisionCare AI</p>
            <p className="text-slate-400 text-xs truncate">Ward {wardId}</p>
          </div>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-16 z-10 w-6 h-6 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-full flex items-center justify-center text-slate-300 transition-colors"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>

      {/* Nav items */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto no-scrollbar">
        {NAV_ITEMS.map((item) => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              title={collapsed ? item.label : undefined}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                ${active
                  ? "text-white bg-white/15 shadow-inner-glow"
                  : "text-slate-400 hover:text-white hover:bg-white/8"
                }
                ${collapsed ? "justify-center" : ""}
              `}
            >
              <span className={active ? "text-brand-400" : "text-slate-500"}>
                {item.icon}
              </span>
              {!collapsed && (
                <span className="animate-fade-in truncate">{item.label}</span>
              )}
              {active && !collapsed && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-400 shrink-0" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-slate-800 px-2 py-3 space-y-1">
        {/* Dark mode toggle */}
        <button
          onClick={onToggleDark}
          title={dark ? "Switch to light mode" : "Switch to dark mode"}
          className={`
            flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium w-full
            text-slate-400 hover:text-white hover:bg-white/8 transition-all duration-200
            ${collapsed ? "justify-center" : ""}
          `}
        >
          {dark ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-slate-400" />}
          {!collapsed && <span className="animate-fade-in">{dark ? "Light Mode" : "Dark Mode"}</span>}
        </button>

        {/* Nurse profile */}
        {!collapsed && (
          <div className="flex items-center gap-2.5 px-3 py-2 animate-fade-in">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-signal-teal flex items-center justify-center text-white text-xs font-bold shrink-0">
              {nurseName.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-white text-xs font-semibold truncate">{nurseName}</p>
              <p className="text-slate-500 text-xs truncate">{wardId}</p>
            </div>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={handleLogout}
          title="Logout"
          className={`
            flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium w-full
            text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 transition-all duration-200
            ${collapsed ? "justify-center" : ""}
          `}
        >
          <LogOut size={18} />
          {!collapsed && <span className="animate-fade-in">Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
