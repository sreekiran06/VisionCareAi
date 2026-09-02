from sqlalchemy import Column, String, Uuid
import uuid

from .base import Base, TimestampMixin


class Alert(Base, TimestampMixin):
    __tablename__ = "admin_alerts"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    patient_id = Column(String(100), nullable=True, index=True)
    patient_name = Column(String(255), nullable=True)
    hospital_id = Column(String(100), nullable=False, index=True)
    hospital_name = Column(String(255), nullable=True)
    ward = Column(String(100), nullable=True)
    alert_type = Column(String(100), nullable=False)   # fall, eye_closed, pain, distress, etc.
    severity = Column(String(20), default="medium")    # low | medium | high | critical
    status = Column(String(20), default="pending")     # pending | acknowledged | resolved
    assigned_nurse_id = Column(String(100), nullable=True)
    assigned_nurse_name = Column(String(255), nullable=True)
    acknowledged_at = Column(String(50), nullable=True)
    resolved_at = Column(String(50), nullable=True)
    notes = Column(String(1000), nullable=True)

    def __repr__(self):
        return f"<Alert {self.alert_type} - {self.severity} - {self.status}>"
