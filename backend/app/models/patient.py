from sqlalchemy import Column, String, Integer, ForeignKey, Enum, Boolean, JSON, Uuid
from sqlalchemy.orm import relationship
import uuid
import enum

from .base import Base, TimestampMixin

class PatientCondition(str, enum.Enum):
    STROKE = "stroke"
    ALS = "als"
    PARALYSIS = "paralysis"
    POST_SURGERY = "post_surgery"
    ELDERLY = "elderly"
    OTHER = "other"

class Patient(Base, TimestampMixin):
    __tablename__ = "patients"
    
    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    age = Column(Integer, nullable=False)
    bed_number = Column(String(20), nullable=False)
    ward_id = Column(String(50), nullable=False, index=True)
    hospital_id = Column(String(100), nullable=False)
    condition = Column(Enum(PatientCondition), nullable=False)
    notes = Column(String(1000))
    is_active = Column(Boolean, default=True)
    
    # Relationships
    gesture_mappings = relationship("GestureMapping", back_populates="patient", cascade="all, delete-orphan")
    calibration_data = relationship("CalibrationSample", back_populates="patient", cascade="all, delete-orphan")
    detections = relationship("Detection", back_populates="patient")
    
    # Patient-specific thresholds (JSON for flexibility)
    thresholds = Column(JSON, default=dict)
    
    def __repr__(self):
        return f"<Patient {self.name} - Bed {self.bed_number}>"
