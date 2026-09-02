import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Building2, Users, Camera, UserRound, Bell,
  BarChart3, Shield, Settings, CreditCard, GitBranch,
  ChevronLeft, ChevronRight, Activity, LogOut, Stethoscope,
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard',      to: '/admin',               icon: LayoutDashboard,  group: 'Overview'    },
  { label: 'Analytics',      to: '/admin/analytics',     icon: BarChart3,         group: 'Overview'    },
  { label: 'Hospitals',      to: '/admin/hospitals',     icon: Building2,         group: 'Management'  },
  { label: 'Users',          to: '/admin/users',         icon: Users,             group: 'Management'  },
  { label: 'Cameras',        to: '/admin/cameras',       icon: Camera,            group: 'Management'  },
  { label: 'Patients',       to: '/admin/patients',      icon: UserRound,         group: 'Management'  },
  { label: 'Alerts',         to: '/admin/alerts',        icon: Bell,              group: 'Operations'  },
  { label: 'Monitoring',     to: '/admin/monitoring',    icon: Activity,          group: 'Operations'  },
  { label: 'Audit Logs',     to: '/admin/audit',         icon: Shield,            group: 'Security'    },
  { label: 'Subscriptions',  to: '/admin/subscriptions', icon: CreditCard,        group: 'Settings'    },
  { label: 'Notifications',  to: '/admin/notifications', icon: Settings,          group: 'Settings'    },
  { label: 'Hierarchy',      to: '/admin/hierarchy',     icon: GitBranch,         group: 'Settings'    },
];

const groups = ['Overview', 'Management', 'Operations', 'Security', 'Settings'];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export const AdminSidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('vc_access_token');
    navigate('/login');
  };

  return (
    <aside
      className={`fixed top-0 left-0 h-full z-40 flex flex-col
        bg-slate-950 border-r border-white/5
        transition-all duration-300 ease-in-out
        ${collapsed ? 'w-16' : 'w-64'}`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/5">
        <div className="w-8 h-8 rounded-xl bg-gradient-brand flex items-center justify-center shrink-0">
          <Stethoscope size={16} className="text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-sm font-display font-bold text-white">VisionCare</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest">Admin Portal</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 no-scrollbar">
        {groups.map((group) => {
          const items = navItems.filter((n) => n.group === group);
          return (
            <div key={group} className="mb-4">
              {!collapsed && (
                <p className="px-4 mb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-600">
                  {group}
                </p>
              )}
              {items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/admin'}
                    className={({ isActive }) =>
                      `flex items-center gap-3 mx-2 px-3 py-2.5 rounded-xl text-sm font-medium
                       transition-all duration-200 group relative
                       ${isActive
                         ? 'bg-blue-600/20 text-blue-400 border border-blue-500/20'
                         : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                       }`
                    }
                  >
                    <Icon size={17} className="shrink-0" />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                    {/* Tooltip when collapsed */}
                    {collapsed && (
                      <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-800 border border-white/10
                        rounded-lg text-xs font-medium text-slate-200 whitespace-nowrap
                        opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-xl z-50">
                        {item.label}
                      </div>
                    )}
                  </NavLink>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/5 p-3 space-y-1">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium
            text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all duration-200 group relative"
        >
          <LogOut size={17} className="shrink-0" />
          {!collapsed && <span>Logout</span>}
          {collapsed && (
            <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-800 border border-white/10
              rounded-lg text-xs font-medium text-slate-200 whitespace-nowrap
              opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-xl z-50">
              Logout
            </div>
          )}
        </button>

        {/* Collapse toggle */}
        <button
          onClick={onToggle}
          className="flex items-center justify-center w-full py-2 rounded-xl
            text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
    </aside>
  );
};
