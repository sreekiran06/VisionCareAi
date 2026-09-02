from sqlalchemy import Column, String, JSON, Uuid
import uuid

from .base import Base, TimestampMixin


class AuditLog(Base, TimestampMixin):
    __tablename__ = "audit_logs"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id = Column(String(100), nullable=True, index=True)
    user_email = Column(String(255), nullable=True)
    user_name = Column(String(255), nullable=True)
    action = Column(String(100), nullable=False, index=True)   # user_login, patient_added, etc.
    entity_type = Column(String(50), nullable=True)            # user, patient, camera, alert, hospital
    entity_id = Column(String(100), nullable=True)
    detail = Column(JSON, default=dict)
    ip_address = Column(String(50), nullable=True)

    def __repr__(self):
        return f"<AuditLog {self.action} by {self.user_email}>"
