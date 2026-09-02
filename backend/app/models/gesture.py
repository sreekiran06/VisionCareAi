from sqlalchemy import Column, String, ForeignKey, Enum, Float, Boolean, LargeBinary, JSON, Uuid
from sqlalchemy.orm import relationship
import uuid
import enum

from .base import Base, TimestampMixin

class GestureType(str, enum.Enum):
    DOUBLE_BLINK = "double_blink"
    SUSTAINED_CLOSE = "sustained_close"
    SMILE = "smile"
    EYEBROW_RAISE = "eyebrow_raise"
    HEAD_LEFT = "head_left"
    HEAD_RIGHT = "head_right"
    MOUTH_OPEN = "mouth_open"

class NeedType(str, enum.Enum):
    WATER = "water"
    FOOD = "food"
    NURSE = "nurse"
    PAIN = "pain"
    WASHROOM = "washroom"
    EMERGENCY = "emergency"

class GestureMapping(Base, TimestampMixin):
    __tablename__ = "gesture_mappings"
    
    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    patient_id = Column(Uuid, ForeignKey("patients.id"), nullable=False)
    gesture_type = Column(Enum(GestureType), nullable=False)
    need_type = Column(Enum(NeedType), nullable=False)
    is_active = Column(Boolean, default=True)
    custom_threshold = Column(Float)  # Override default if needed
    
    patient = relationship("Patient", back_populates="gesture_mappings")

class CalibrationSample(Base, TimestampMixin):
    __tablename__ = "calibration_samples"
    
    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    patient_id = Column(Uuid, ForeignKey("patients.id"), nullable=False)
    gesture_type = Column(Enum(GestureType), nullable=False)
    landmark_data = Column(LargeBinary)  # Serialized numpy array
    metrics_snapshot = Column(JSON)  # EAR, MAR values at capture time
    is_valid = Column(Boolean, default=True)
    
    patient = relationship("Patient", back_populates="calibration_data")
