from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime


# ─── Hospital Schemas ─────────────────────────────────────────────────────────

class HospitalCreate(BaseModel):
    name: str
    address: Optional[str] = None
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    license_type: str = "basic"
    subscription_status: str = "active"
    subscription_expiry: Optional[str] = None
    max_cameras: int = 10
    status: str = "active"


class HospitalUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    license_type: Optional[str] = None
    subscription_status: Optional[str] = None
    subscription_expiry: Optional[str] = None
    max_cameras: Optional[int] = None
    current_cameras: Optional[int] = None
    current_patients: Optional[int] = None
    status: Optional[str] = None


class HospitalResponse(BaseModel):
    id: UUID
    name: str
    address: Optional[str] = None
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    license_type: str
    subscription_status: str
    subscription_expiry: Optional[str] = None
    max_cameras: int
    current_cameras: int
    current_patients: int
    status: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ─── Camera Schemas ───────────────────────────────────────────────────────────

class CameraCreate(BaseModel):
    hospital_id: str
    ward: str
    bed_number: str
    ip_address: Optional[str] = None
    patient_id: Optional[str] = None
    patient_name: Optional[str] = None


class CameraUpdate(BaseModel):
    hospital_id: Optional[str] = None
    ward: Optional[str] = None
    bed_number: Optional[str] = None
    ip_address: Optional[str] = None
    status: Optional[str] = None
    fps: Optional[float] = None
    network_latency: Optional[float] = None
    last_connected: Optional[str] = None
    health_status: Optional[str] = None
    patient_id: Optional[str] = None
    patient_name: Optional[str] = None


class CameraResponse(BaseModel):
    id: UUID
    hospital_id: str
    ward: str
    bed_number: str
    patient_id: Optional[str] = None
    patient_name: Optional[str] = None
    ip_address: Optional[str] = None
    status: str
    fps: float
    network_latency: float
    last_connected: Optional[str] = None
    health_status: str
    is_active: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ─── Alert Schemas ────────────────────────────────────────────────────────────

class AlertCreate(BaseModel):
    patient_id: Optional[str] = None
    patient_name: Optional[str] = None
    hospital_id: str
    hospital_name: Optional[str] = None
    ward: Optional[str] = None
    alert_type: str
    severity: str = "medium"
    assigned_nurse_id: Optional[str] = None
    assigned_nurse_name: Optional[str] = None
    notes: Optional[str] = None


class AlertResponse(BaseModel):
    id: UUID
    patient_id: Optional[str] = None
    patient_name: Optional[str] = None
    hospital_id: str
    hospital_name: Optional[str] = None
    ward: Optional[str] = None
    alert_type: str
    severity: str
    status: str
    assigned_nurse_id: Optional[str] = None
    assigned_nurse_name: Optional[str] = None
    acknowledged_at: Optional[str] = None
    resolved_at: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ─── Audit Log Schemas ────────────────────────────────────────────────────────

class AuditLogResponse(BaseModel):
    id: UUID
    user_id: Optional[str] = None
    user_email: Optional[str] = None
    user_name: Optional[str] = None
    action: str
    entity_type: Optional[str] = None
    entity_id: Optional[str] = None
    detail: Optional[Dict[str, Any]] = None
    ip_address: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ─── User Admin Schemas ───────────────────────────────────────────────────────

class AdminUserCreate(BaseModel):
    email: str
    password: str
    name: str
    role: str = "nurse"
    ward_id: str = "ICU-1"
    hospital_id: Optional[str] = None
    phone: Optional[str] = None


class AdminUserUpdate(BaseModel):
    email: Optional[str] = None
    name: Optional[str] = None
    role: Optional[str] = None
    ward_id: Optional[str] = None
    hospital_id: Optional[str] = None
    phone: Optional[str] = None
    is_active: Optional[bool] = None


class AdminUserResponse(BaseModel):
    id: UUID
    email: str
    name: str
    role: str
    ward_id: str
    hospital_id: Optional[str] = None
    phone: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ResetPasswordRequest(BaseModel):
    new_password: str


# ─── Dashboard Stats ──────────────────────────────────────────────────────────

class DashboardStats(BaseModel):
    total_hospitals: int = 0
    total_active_patients: int = 0
    total_cameras: int = 0
    online_cameras: int = 0
    offline_cameras: int = 0
    total_nurses: int = 0
    total_doctors: int = 0
    total_alerts_today: int = 0
    critical_alerts: int = 0
    websocket_connections: int = 0
    detection_accuracy: float = 97.3
    alert_response_time: float = 2.4   # minutes
    cpu_usage: float = 42.0
    memory_usage: float = 61.0
    server_status: str = "healthy"


# ─── Analytics ────────────────────────────────────────────────────────────────

class TimeSeriesPoint(BaseModel):
    label: str
    value: int


class DistributionPoint(BaseModel):
    name: str
    value: int
    color: Optional[str] = None


class AnalyticsResponse(BaseModel):
    daily_alerts: List[TimeSeriesPoint] = []
    weekly_alerts: List[TimeSeriesPoint] = []
    monthly_alerts: List[TimeSeriesPoint] = []
    patient_distribution: List[DistributionPoint] = []
    hospital_distribution: List[DistributionPoint] = []
    camera_status: List[DistributionPoint] = []
    alert_types: List[DistributionPoint] = []
    avg_response_time: List[TimeSeriesPoint] = []
    false_alert_pct: float = 5.2


# ─── Notification Settings ────────────────────────────────────────────────────

class NotificationSettings(BaseModel):
    email_enabled: bool = True
    sms_enabled: bool = False
    alert_threshold_critical: int = 1
    alert_threshold_high: int = 3
    alert_threshold_medium: int = 5
    escalation_time_minutes: int = 10
    emergency_contacts: List[Dict[str, str]] = []
    smtp_host: Optional[str] = None
    smtp_port: int = 587
    smtp_user: Optional[str] = None
    smtp_password: Optional[str] = None
    twilio_sid: Optional[str] = None
    twilio_token: Optional[str] = None
    twilio_from: Optional[str] = None
