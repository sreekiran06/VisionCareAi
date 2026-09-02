import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Building2, Layout, Grid, Bed, UserRound } from 'lucide-react';
import { hospitalsApi, patientsAdminApi } from '../services/adminApi';
import type { Hospital, AdminPatient } from '../types/admin.types';

interface TreeNodeProps {
  label: string;
  icon: React.ReactNode;
  iconColor: string;
  children?: React.ReactNode;
  badge?: string | number;
  depth?: number;
}

const TreeNode: React.FC<TreeNodeProps> = ({ label, icon, iconColor, children, badge, depth = 0 }) => {
  const [open, setOpen] = useState(depth < 2);
  return (
    <div className={`${depth > 0 ? 'ml-5 border-l border-white/5 pl-4' : ''}`}>
      <button
        onClick={() => children && setOpen((o) => !o)}
        className={`flex items-center gap-2 w-full py-2.5 px-3 rounded-xl
          hover:bg-white/5 transition-colors text-left group ${children ? 'cursor-pointer' : 'cursor-default'}`}
      >
        <span className={`shrink-0 ${iconColor}`}>{icon}</span>
        <span className="text-sm font-medium text-slate-300 flex-1">{label}</span>
        {badge !== undefined && (
          <span className="text-xs font-semibold text-slate-500 bg-white/5 px-2 py-0.5 rounded-full">{badge}</span>
        )}
        {children && (
          <span className="text-slate-600 group-hover:text-slate-400 transition-colors">
            {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </span>
        )}
      </button>
      {open && children && <div className="mt-0.5">{children}</div>}
    </div>
  );
};

export const HierarchyPage: React.FC = () => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [patients, setPatients]   = useState<AdminPatient[]>([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    Promise.all([
      hospitalsApi.list({ limit: 100 }),
      patientsAdminApi.list({ limit: 200 }),
    ]).then(([h, p]) => {
      setHospitals(h.data);
      setPatients(p.data);
    }).finally(() => setLoading(false));
  }, []);

  // Group patients by hospital and ward
  const grouped = hospitals.map((h) => {
    const hPatients = patients.filter((p) => p.hospital_id === h.id);
    const wardMap: Record<string, AdminPatient[]> = {};
    hPatients.forEach((p) => {
      if (!wardMap[p.ward_id]) wardMap[p.ward_id] = [];
      wardMap[p.ward_id].push(p);
    });
    return { hospital: h, wardMap };
  });

  if (loading) return <div className="h-96 rounded-2xl bg-white/5 animate-pulse" />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold text-white">Multi-Hospital Hierarchy</h1>
        <p className="text-sm text-slate-500 mt-0.5">Organization → Hospital → Ward → Bed → Patient</p>
      </div>

      <div className="rounded-2xl bg-white/3 border border-white/10 p-6">
        <TreeNode label="VisionCare AI Organization" icon={<span className="text-lg">🏢</span>} iconColor="" badge={hospitals.length + ' hospitals'}>
          {grouped.map(({ hospital: h, wardMap }) => (
            <TreeNode key={h.id} label={h.name} icon={<Building2 size={16} />} iconColor="text-blue-400"
              badge={`${h.current_patients} patients`} depth={1}>
              {Object.keys(wardMap).length === 0 ? (
                <TreeNode label="No wards configured" icon={<Layout size={14} />} iconColor="text-slate-600" depth={2} />
              ) : (
                Object.entries(wardMap).map(([ward, wPatients]) => (
                  <TreeNode key={ward} label={`Ward: ${ward}`} icon={<Layout size={14} />} iconColor="text-violet-400"
                    badge={wPatients.length} depth={2}>
                    {wPatients.map((p) => (
                      <TreeNode key={p.id} label={p.name} icon={<UserRound size={13} />} iconColor="text-emerald-400"
                        badge={`Bed ${p.bed_number}`} depth={3} />
                    ))}
                  </TreeNode>
                ))
              )}
            </TreeNode>
          ))}
          {grouped.length === 0 && (
            <TreeNode label="No hospitals registered" icon={<Building2 size={16} />} iconColor="text-slate-600" depth={1} />
          )}
        </TreeNode>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-slate-500">
        {[
          { icon: '🏢', label: 'Organization' },
          { icon: '🏥', label: 'Hospital',  color: 'text-blue-400' },
          { icon: '🏨', label: 'Ward',      color: 'text-violet-400' },
          { icon: '👤', label: 'Patient',   color: 'text-emerald-400' },
        ].map(({ icon, label, color }) => (
          <div key={label} className={`flex items-center gap-1.5 ${color ?? ''}`}>
            <span>{icon}</span><span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
