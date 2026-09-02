import React from 'react';
import { Search, Sun, Moon, Bell, Wifi, WifiOff } from 'lucide-react';

interface TopBarProps {
  sidebarCollapsed: boolean;
  isDark: boolean;
  onThemeToggle: () => void;
  wsConnected?: boolean;
  adminName?: string;
  adminRole?: string;
}

export const AdminTopBar: React.FC<TopBarProps> = ({
  sidebarCollapsed, isDark, onThemeToggle, wsConnected = false, adminName = 'Admin', adminRole = 'super_admin',
}) => (
  <header
    className={`fixed top-0 right-0 z-30 flex items-center gap-4
      h-16 px-6 border-b border-white/5
      bg-slate-950/80 backdrop-blur-md
      transition-all duration-300
      ${sidebarCollapsed ? 'left-16' : 'left-64'}`}
  >
    {/* Search */}
    <div className="relative flex-1 max-w-sm">
      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
      <input
        type="search"
        placeholder="Search anything…"
        className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2
          text-sm text-slate-200 placeholder-slate-600
          focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50
          transition-all duration-200"
      />
    </div>

    <div className="ml-auto flex items-center gap-2">
      {/* WebSocket status */}
      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
        ${wsConnected ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-700/50 text-slate-500'}`}>
        {wsConnected ? <Wifi size={13} /> : <WifiOff size={13} />}
        <span className="hidden sm:inline">{wsConnected ? 'Live' : 'Offline'}</span>
      </div>

      {/* Theme toggle */}
      <button
        onClick={onThemeToggle}
        className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-white/8 transition-colors"
        title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {isDark ? <Sun size={17} /> : <Moon size={17} />}
      </button>

      {/* Notifications */}
      <button className="relative p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-white/8 transition-colors">
        <Bell size={17} />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full" />
      </button>

      {/* Avatar */}
      <div className="flex items-center gap-2.5 pl-3 border-l border-white/10">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center">
          <span className="text-xs font-bold text-white">{adminName[0]?.toUpperCase()}</span>
        </div>
        <div className="hidden sm:block">
          <p className="text-sm font-semibold text-white leading-none">{adminName}</p>
          <p className="text-[10px] text-slate-500 capitalize mt-0.5">{adminRole.replace('_', ' ')}</p>
        </div>
      </div>
    </div>
  </header>
);
