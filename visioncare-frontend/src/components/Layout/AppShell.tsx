import React, { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";

interface AppShellProps {
  children: React.ReactNode;
  nurseName?: string;
  wardId?: string;
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  nurseName,
  wardId,
}) => {
  const [dark, setDark] = useState<boolean>(() => {
    return localStorage.getItem("vc_dark_mode") === "true";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("vc_dark_mode", String(dark));
  }, [dark]);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      <Sidebar
        nurseName={nurseName}
        wardId={wardId}
        dark={dark}
        onToggleDark={() => setDark((d) => !d)}
      />
      <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950">
        {children}
      </main>
    </div>
  );
};

export default AppShell;
