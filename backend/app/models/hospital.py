from sqlalchemy import Column, String, Integer, Boolean, Uuid
import uuid

from .base import Base, TimestampMixin


class Hospital(Base, TimestampMixin):
    __tablename__ = "hospitals"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    address = Column(String(500))
    contact_person = Column(String(255))
    phone = Column(String(50))
    email = Column(String(255))
    license_type = Column(String(50), default="basic")   # basic | professional | enterprise
    subscription_status = Column(String(50), default="active")  # active | expired | suspended
    subscription_expiry = Column(String(50))   # ISO date string
    max_cameras = Column(Integer, default=10)
    current_cameras = Column(Integer, default=0)
    current_patients = Column(Integer, default=0)
    status = Column(String(20), default="active")   # active | suspended
    is_active = Column(Boolean, default=True)

    def __repr__(self):
        return f"<Hospital {self.name}>"
