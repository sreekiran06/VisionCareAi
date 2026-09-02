import axios from 'axios';
import type {
  Hospital, HospitalCreate,
  Camera, CameraCreate,
  AdminAlert,
  AdminUser, AdminUserCreate,
  AdminPatient,
  AuditLog,
  DashboardStats,
  AnalyticsData,
  NotificationSettings,
} from '../types/admin.types';

const BASE = process.env.REACT_APP_API_URL ?? 'http://localhost:8000';

export const adminAxios = axios.create({ baseURL: BASE });

// ── Attach JWT automatically ──────────────────────────────────────────────────
adminAxios.interceptors.request.use((config) => {
  const token = localStorage.getItem('vc_access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Auto-logout on 401 ────────────────────────────────────────────────────────
adminAxios.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('vc_access_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  },
);

// ─── Dashboard Stats ──────────────────────────────────────────────────────────
export const adminStatsApi = {
  get: () => adminAxios.get<DashboardStats>('/api/admin/stats/'),
};

// ─── Hospitals ────────────────────────────────────────────────────────────────
export const hospitalsApi = {
  list:   (params?: Record<string, unknown>) => adminAxios.get<Hospital[]>('/api/admin/hospitals/', { params }),
  create: (data: HospitalCreate)             => adminAxios.post<Hospital>('/api/admin/hospitals/', data),
  update: (id: string, data: Partial<HospitalCreate>) => adminAxios.put<Hospital>(`/api/admin/hospitals/${id}`, data),
  delete: (id: string)                       => adminAxios.delete(`/api/admin/hospitals/${id}`),
  toggle: (id: string)                       => adminAxios.patch<Hospital>(`/api/admin/hospitals/${id}/toggle-status`),
};

// ─── Users ────────────────────────────────────────────────────────────────────
export const usersApi = {
  list:          (params?: Record<string, unknown>) => adminAxios.get<AdminUser[]>('/api/admin/users/', { params }),
  create:        (data: AdminUserCreate)            => adminAxios.post<AdminUser>('/api/admin/users/', data),
  update:        (id: string, data: Partial<AdminUserCreate>) => adminAxios.put<AdminUser>(`/api/admin/users/${id}`, data),
  delete:        (id: string)                       => adminAxios.delete(`/api/admin/users/${id}`),
  resetPassword: (id: string, newPassword: string)  => adminAxios.post(`/api/admin/users/${id}/reset-password`, { new_password: newPassword }),
  toggleActive:  (id: string)                       => adminAxios.patch<AdminUser>(`/api/admin/users/${id}/activate`),
};

// ─── Cameras ──────────────────────────────────────────────────────────────────
export const camerasApi = {
  list:          (params?: Record<string, unknown>) => adminAxios.get<Camera[]>('/api/admin/cameras/', { params }),
  create:        (data: CameraCreate)               => adminAxios.post<Camera>('/api/admin/cameras/', data),
  update:        (id: string, data: Partial<CameraCreate>) => adminAxios.put<Camera>(`/api/admin/cameras/${id}`, data),
  delete:        (id: string)                       => adminAxios.delete(`/api/admin/cameras/${id}`),
  restart:       (id: string)                       => adminAxios.post(`/api/admin/cameras/${id}/restart`),
  assignPatient: (id: string, patientId: string, patientName: string) =>
    adminAxios.post(`/api/admin/cameras/${id}/assign-patient`, null, { params: { patient_id: patientId, patient_name: patientName } }),
};

// ─── Patients ─────────────────────────────────────────────────────────────────
export const patientsAdminApi = {
  list:      (params?: Record<string, unknown>) => adminAxios.get<AdminPatient[]>('/api/admin/patients/', { params }),
  create:    (data: Partial<AdminPatient>)       => adminAxios.post<AdminPatient>('/api/admin/patients/', data),
  update:    (id: string, data: Partial<AdminPatient>) => adminAxios.put<AdminPatient>(`/api/admin/patients/${id}`, data),
  delete:    (id: string)                        => adminAxios.delete(`/api/admin/patients/${id}`),
  discharge: (id: string)                        => adminAxios.patch<AdminPatient>(`/api/admin/patients/${id}/discharge`),
};

// ─── Alerts ───────────────────────────────────────────────────────────────────
export const alertsAdminApi = {
  list:        (params?: Record<string, unknown>) => adminAxios.get<AdminAlert[]>('/api/admin/alerts/', { params }),
  acknowledge: (id: string)                       => adminAxios.post<AdminAlert>(`/api/admin/alerts/${id}/acknowledge`),
  resolve:     (id: string)                       => adminAxios.post<AdminAlert>(`/api/admin/alerts/${id}/resolve`),
  exportCsv:   (params?: Record<string, unknown>) => adminAxios.get('/api/admin/alerts/export/csv', { params, responseType: 'blob' }),
};

// ─── Analytics ────────────────────────────────────────────────────────────────
export const analyticsApi = {
  get: () => adminAxios.get<AnalyticsData>('/api/admin/analytics/'),
};

// ─── Audit Logs ───────────────────────────────────────────────────────────────
export const auditApi = {
  list: (params?: Record<string, unknown>) => adminAxios.get<AuditLog[]>('/api/admin/audit-logs/', { params }),
};

// ─── Notifications ────────────────────────────────────────────────────────────
export const notificationsApi = {
  get:    ()                            => adminAxios.get<NotificationSettings>('/api/admin/notifications/'),
  update: (data: NotificationSettings) => adminAxios.put<NotificationSettings>('/api/admin/notifications/', data),
};
