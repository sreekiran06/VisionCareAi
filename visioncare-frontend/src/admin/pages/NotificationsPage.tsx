import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2 } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { ToastStack } from '../components/ui/Toast';
import { notificationsApi } from '../services/adminApi';
import type { NotificationSettings } from '../types/admin.types';

const defaultSettings: NotificationSettings = {
  email_enabled: true, sms_enabled: false,
  alert_threshold_critical: 1, alert_threshold_high: 3, alert_threshold_medium: 5,
  escalation_time_minutes: 10, emergency_contacts: [],
  smtp_host: '', smtp_port: 587, smtp_user: '', smtp_password: '',
  twilio_sid: '', twilio_token: '', twilio_from: '',
};

export const NotificationsPage: React.FC = () => {
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const toast = useToast();

  useEffect(() => {
    notificationsApi.get().then(({ data }) => setSettings(data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try { await notificationsApi.update(settings); toast.success('Settings saved'); }
    catch { toast.error('Save failed'); }
    finally { setSaving(false); }
  };

  const s = <K extends keyof NotificationSettings>(k: K, v: NotificationSettings[K]) =>
    setSettings((p) => ({ ...p, [k]: v }));

  const addContact = () => {
    setSettings((p) => ({ ...p, emergency_contacts: [...p.emergency_contacts, { name: '', phone: '', email: '' }] }));
  };

  const removeContact = (i: number) => {
    setSettings((p) => ({ ...p, emergency_contacts: p.emergency_contacts.filter((_, idx) => idx !== i) }));
  };

  const updateContact = (i: number, k: string, v: string) => {
    setSettings((p) => {
      const contacts = [...p.emergency_contacts];
      contacts[i] = { ...contacts[i], [k]: v };
      return { ...p, emergency_contacts: contacts };
    });
  };

  if (loading) return <div className="h-64 rounded-2xl bg-white/5 animate-pulse" />;

  const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="rounded-2xl bg-white/3 border border-white/10 p-6">
      <h3 className="text-sm font-semibold text-slate-200 mb-5">{title}</h3>
      {children}
    </div>
  );

  const Toggle: React.FC<{ label: string; checked: boolean; onChange: (v: boolean) => void; desc?: string }> = ({ label, checked, onChange, desc }) => (
    <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
      <div>
        <p className="text-sm font-medium text-slate-300">{label}</p>
        {desc && <p className="text-xs text-slate-500">{desc}</p>}
      </div>
      <button onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors duration-200
          ${checked ? 'bg-blue-600' : 'bg-slate-700'}`}>
        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200
          ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  );

  const Field: React.FC<{ label: string; value: string | number; type?: string; onChange: (v: string) => void }> = ({ label, value, type = 'text', onChange }) => (
    <div>
      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500/50" />
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Notification Settings</h1>
          <p className="text-sm text-slate-500 mt-0.5">Configure alerting channels and thresholds</p>
        </div>
        <button onClick={save} disabled={saving}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors disabled:opacity-50">
          <Save size={15} /> {saving ? 'Saving…' : 'Save Settings'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Section title="📧 Email Notifications">
          <Toggle label="Enable Email Alerts" checked={settings.email_enabled} onChange={(v) => s('email_enabled', v)} desc="Send email on critical events" />
          <div className="space-y-3 mt-4">
            <Field label="SMTP Host"     value={settings.smtp_host ?? ''}    onChange={(v) => s('smtp_host', v)} />
            <Field label="SMTP Port"     value={settings.smtp_port}           type="number" onChange={(v) => s('smtp_port', Number(v))} />
            <Field label="SMTP Username" value={settings.smtp_user ?? ''}     onChange={(v) => s('smtp_user', v)} />
            <Field label="SMTP Password" value={settings.smtp_password ?? ''} type="password" onChange={(v) => s('smtp_password', v)} />
          </div>
        </Section>

        <Section title="📱 SMS Notifications">
          <Toggle label="Enable SMS Alerts" checked={settings.sms_enabled} onChange={(v) => s('sms_enabled', v)} desc="Send SMS via Twilio" />
          <div className="space-y-3 mt-4">
            <Field label="Twilio Account SID" value={settings.twilio_sid ?? ''}   onChange={(v) => s('twilio_sid', v)} />
            <Field label="Twilio Auth Token"   value={settings.twilio_token ?? ''} type="password" onChange={(v) => s('twilio_token', v)} />
            <Field label="Twilio From Number"  value={settings.twilio_from ?? ''}  onChange={(v) => s('twilio_from', v)} />
          </div>
        </Section>

        <Section title="⚡ Alert Thresholds">
          <div className="space-y-4">
            {[
              { label: 'Critical threshold (immediate)',     key: 'alert_threshold_critical' as const, color: 'text-rose-400' },
              { label: 'High threshold (after N alerts)',    key: 'alert_threshold_high'     as const, color: 'text-amber-400' },
              { label: 'Medium threshold (after N alerts)',  key: 'alert_threshold_medium'   as const, color: 'text-blue-400' },
              { label: 'Escalation time (minutes)',          key: 'escalation_time_minutes'  as const, color: 'text-violet-400' },
            ].map(({ label, key, color }) => (
              <div key={key} className="flex items-center justify-between">
                <label className={`text-sm font-medium ${color}`}>{label}</label>
                <input
                  type="number" min={1} max={100}
                  value={settings[key] as number}
                  onChange={(e) => s(key, Number(e.target.value))}
                  className="w-20 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-200 text-center focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                />
              </div>
            ))}
          </div>
        </Section>

        <Section title="🚨 Emergency Contacts">
          <div className="space-y-3">
            {settings.emergency_contacts.map((c, i) => (
              <div key={i} className="flex gap-2 items-start">
                <div className="flex-1 space-y-2">
                  {['name','phone','email'].map((k) => (
                    <input key={k} placeholder={k} value={(c as Record<string,string>)[k] ?? ''}
                      onChange={(e) => updateContact(i, k, e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500/50" />
                  ))}
                </div>
                <button onClick={() => removeContact(i)} className="p-2 rounded-lg hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 transition-colors mt-0.5">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            <button onClick={addContact}
              className="flex items-center gap-2 w-full py-2.5 rounded-xl border border-dashed border-white/20 text-sm text-slate-500 hover:text-slate-300 hover:border-white/40 transition-colors">
              <Plus size={14} /> Add Contact
            </button>
          </div>
        </Section>
      </div>

      <ToastStack toasts={toast.toasts} dismiss={toast.dismiss} />
    </div>
  );
};
