import axios, { AxiosInstance } from "axios";

const API_BASE_URL =
  process.env.REACT_APP_API_URL ?? "http://localhost:8000";

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 second timeout for cold starts
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach the auth token (if present) to every outgoing request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("vc_access_token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Central place to react to auth failures.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("vc_access_token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// ---- Patients ----
export const patientsApi = {
  list: (wardId?: string) =>
    api.get("/api/patients", { params: wardId ? { ward_id: wardId } : {} }),
  get: (patientId: string) => api.get(`/api/patients/${patientId}`),
  create: (data: Record<string, unknown>) =>
    api.post("/api/patients", data),
  update: (patientId: string, data: Record<string, unknown>) =>
    api.patch(`/api/patients/${patientId}`, data),
  discharge: (patientId: string) =>
    api.delete(`/api/patients/${patientId}`),
};

// ---- Gesture mappings ----
export const gestureMappingsApi = {
  list: (patientId: string) =>
    api.get("/api/gesture-mappings", { params: { patient_id: patientId } }),
  set: (patientId: string, gestureType: string, needType: string) =>
    api.post("/api/gesture-mappings", {
      patient_id: patientId,
      gesture_type: gestureType,
      need_type: needType,
    }),
  remove: (mappingId: string) =>
    api.delete(`/api/gesture-mappings/${mappingId}`),
};

// ---- Calibration ----
export const calibrationApi = {
  start: (patientId: string) =>
    api.post(`/api/calibration/${patientId}/start`),
  saveSample: (
    patientId: string,
    payload: { gesture_type: string; frames: string[]; sample_index: number }
  ) => api.post(`/api/calibration/${patientId}/sample`, payload),
  complete: (patientId: string) =>
    api.post(`/api/calibration/${patientId}/complete`),
};

// ---- Detections / Requests ----
export const detectionsApi = {
  listActive: (wardId: string) =>
    api.get("/api/detections", { params: { ward_id: wardId, status: "pending" } }),
  listRecent: (wardId: string, limit = 20) =>
    api.get("/api/detections", { params: { ward_id: wardId, limit } }),
  acknowledge: (detectionId: string, nurseId: string, status: string) =>
    api.patch(`/api/detections/${detectionId}/acknowledge`, {
      nurse_id: nurseId,
      status,
    }),
};

// ---- Auth ----
export const authApi = {
  login: (email: string, password: string) =>
    api.post("/api/auth/login", { email, password }),
  me: () => api.get("/api/auth/me"),
};

export default api;
