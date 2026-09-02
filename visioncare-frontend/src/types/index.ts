export type NeedType =
  | "water"
  | "food"
  | "nurse"
  | "pain"
  | "washroom"
  | "emergency";

export type GestureType =
  | "double_blink"
  | "sustained_close"
  | "smile"
  | "eyebrow_raise"
  | "head_left"
  | "head_right"
  | "mouth_open";

export type RequestStatus =
  | "pending"
  | "acknowledged"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "false_positive";

export type PatientCondition =
  | "stroke"
  | "als"
  | "paralysis"
  | "post_surgery"
  | "elderly"
  | "other";

export interface Patient {
  id: string;
  name: string;
  age: number;
  bedNumber?: string;
  bed_number?: string;
  wardId?: string;
  ward_id?: string;
  hospitalId?: string;
  hospital_id?: string;
  condition: PatientCondition;
  notes?: string;
  isActive?: boolean;
  is_active?: boolean;
  createdAt?: string;
  created_at?: string;
}

export interface PatientRequest {
  id: string;
  patientId: string;
  patientName: string;
  bedNumber: string;
  need: NeedType;
  gestureType?: GestureType;
  confidence: number;
  timestamp: Date;
  status: RequestStatus;
  acknowledgedBy?: string;
  responseTimeMs?: number;
}

export interface GestureMapping {
  id: string;
  patientId: string;
  gestureType: GestureType;
  needType: NeedType;
  isActive: boolean;
  customThreshold?: number;
}

export interface CalibrationInstruction {
  title: string;
  instruction: string;
  demoVideo?: string;
}

export interface CalibrationSession {
  patientId: string;
  patientName: string;
  gesturesToCalibrate: GestureType[];
  samplesPerGesture: number;
  instructions: Record<GestureType, CalibrationInstruction>;
}

export interface WardStats {
  activePatients: number;
  pendingRequests: number;
  completedToday: number;
  avgResponseMinutes: number;
}

export type ConnectionStatus = "connecting" | "connected" | "disconnected";

export interface NurseSocketMessage {
  type: "new_request" | "request_updated" | "ping" | "pong";
  [key: string]: unknown;
}
