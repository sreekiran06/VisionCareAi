from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime
from ..models.patient import PatientCondition
from ..models.gesture import GestureType, NeedType
from ..models.detection import RequestStatus

# --- User & Auth ---
class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class UserMe(BaseModel):
    id: UUID
    email: str
    name: str
    role: str
    ward_id: str
    
    class Config:
        from_attributes = True

# --- Patient ---
class PatientCreate(BaseModel):
    name: str
    age: int
    bed_number: str
    ward_id: str
    hospital_id: str
    condition: PatientCondition
    notes: Optional[str] = None
    thresholds: Optional[Dict[str, Any]] = Field(default_factory=dict)

class PatientUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    bed_number: Optional[str] = None
    ward_id: Optional[str] = None
    condition: Optional[PatientCondition] = None
    notes: Optional[str] = None
    thresholds: Optional[Dict[str, Any]] = None

class PatientResponse(BaseModel):
    id: UUID
    name: str
    age: int
    bed_number: str
    ward_id: str
    hospital_id: str
    condition: PatientCondition
    notes: Optional[str] = None
    is_active: bool
    thresholds: Dict[str, Any]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- Gesture Mapping ---
class GestureMappingCreate(BaseModel):
    patient_id: UUID
    gesture_type: GestureType
    need_type: NeedType
    custom_threshold: Optional[float] = None

class GestureMappingResponse(BaseModel):
    id: UUID
    patient_id: UUID
    gesture_type: GestureType
    need_type: NeedType
    is_active: bool
    custom_threshold: Optional[float] = None
    created_at: datetime

    class Config:
        from_attributes = True

# --- Calibration ---
class CalibrationSession(BaseModel):
    patientName: str
    gesturesToCalibrate: List[GestureType]
    instructions: Dict[GestureType, Dict[str, Any]]

class CalibrationSampleCreate(BaseModel):
    gesture_type: GestureType
    frames: List[str]  # Base64 frames
    sample_index: int

# --- Detection ---
class DetectionResponse(BaseModel):
    id: UUID
    patient_id: UUID
    gesture_type: GestureType
    need_type: NeedType
    confidence: float
    status: RequestStatus
    acknowledged_by: Optional[str] = None
    acknowledged_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    response_time_ms: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True
