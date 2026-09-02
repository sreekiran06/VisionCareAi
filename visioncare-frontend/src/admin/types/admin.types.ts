// ─── Admin TypeScript Types ──────────────────────────────────────────────────

export type UserRole = 'super_admin' | 'hospital_admin' | 'doctor' | 'nurse';
export type HospitalStatus = 'active' | 'suspended';
export type LicenseType = 'basic' | 'professional' | 'enterprise';
export type SubscriptionStatus = 'active' | 'expired' | 'suspended';
export type CameraStatus = 'online' | 'offline' | 'disconnected';
export type HealthStatus = 'healthy' | 'degraded' | 'critical' | 'unknown';
export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';
export type AlertStatus = 'pending' | 'acknowledged' | 'resolved';

// ─── Hospital ────────────────────────────────────────────────────────────────
export interface Hospital {
  id: string;
  name: string;
  address?: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  license_type: LicenseType;
  subscription_status: SubscriptionStatus;
  subscription_expiry?: string;
  max_cameras: number;
  current_cameras: number;
  current_patients: number;
  status: HospitalStatus;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface HospitalCreate {
  name: string;
  address?: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  license_type: LicenseType;
  subscription_status: SubscriptionStatus;
  subscription_expiry?: string;
  max_cameras: number;
  status: HospitalStatus;
}

// ─── Camera ──────────────────────────────────────────────────────────────────
export interface Camera {
  id: string;
  hospital_id: string;
  ward: string;
  bed_number: string;
  patient_id?: string;
  patient_name?: string;
  ip_address?: string;
  status: CameraStatus;
  fps: number;
  network_latency: number;
  last_connected?: string;
  health_status: HealthStatus;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface CameraCreate {
  hospital_id: string;
  ward: string;
  bed_number: string;
  ip_address?: string;
  patient_id?: string;
  patient_name?: string;
}

// ─── Alert ───────────────────────────────────────────────────────────────────
export interface AdminAlert {
  id: string;
  patient_id?: string;
  patient_name?: string;
  hospital_id: string;
  hospital_name?: string;
  ward?: string;
  alert_type: string;
  severity: AlertSeverity;
  status: AlertStatus;
  assigned_nurse_id?: string;
  assigned_nurse_name?: string;
  acknowledged_at?: string;
  resolved_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// ─── User ────────────────────────────────────────────────────────────────────
export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  ward_id: string;
  hospital_id?: string;
  phone?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminUserCreate {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  ward_id: string;
  hospital_id?: string;
  phone?: string;
}

// ─── Patient (admin view) ────────────────────────────────────────────────────
export interface AdminPatient {
  id: string;
  name: string;
  age: number;
  bed_number: string;
  ward_id: string;
  hospital_id: string;
  condition: string;
  notes?: string;
  is_active: boolean;
  thresholds: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// ─── Audit Log ───────────────────────────────────────────────────────────────
export interface AuditLog {
  id: string;
  user_id?: string;
  user_email?: string;
  user_name?: string;
  action: string;
  entity_type?: string;
  entity_id?: string;
  detail?: Record<string, unknown>;
  ip_address?: string;
  created_at: string;
}

// ─── Dashboard Stats ─────────────────────────────────────────────────────────
export interface DashboardStats {
  total_hospitals: number;
  total_active_patients: number;
  total_cameras: number;
  online_cameras: number;
  offline_cameras: number;
  total_nurses: number;
  total_doctors: number;
  total_alerts_today: number;
  critical_alerts: number;
  websocket_connections: number;
  detection_accuracy: number;
  alert_response_time: number;
  cpu_usage: number;
  memory_usage: number;
  server_status: string;
}

// ─── Analytics ───────────────────────────────────────────────────────────────
export interface TimeSeriesPoint {
  label: string;
  value: number;
}

export interface DistributionPoint {
  name: string;
  value: number;
  color?: string;
}

export interface AnalyticsData {
  daily_alerts: TimeSeriesPoint[];
  weekly_alerts: TimeSeriesPoint[];
  monthly_alerts: TimeSeriesPoint[];
  patient_distribution: DistributionPoint[];
  hospital_distribution: DistributionPoint[];
  camera_status: DistributionPoint[];
  alert_types: DistributionPoint[];
  avg_response_time: TimeSeriesPoint[];
  false_alert_pct: number;
}

// ─── Notifications ───────────────────────────────────────────────────────────
export interface NotificationSettings {
  email_enabled: boolean;
  sms_enabled: boolean;
  alert_threshold_critical: number;
  alert_threshold_high: number;
  alert_threshold_medium: number;
  escalation_time_minutes: number;
  emergency_contacts: Array<{ name: string; phone: string; email: string }>;
  smtp_host?: string;
  smtp_port: number;
  smtp_user?: string;
  smtp_password?: string;
  twilio_sid?: string;
  twilio_token?: string;
  twilio_from?: string;
}

// ─── UI helpers ──────────────────────────────────────────────────────────────
export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
}

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}
