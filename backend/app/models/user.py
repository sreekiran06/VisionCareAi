from sqlalchemy import Column, String, Boolean, Uuid
import uuid

from .base import Base, TimestampMixin


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    name = Column(String(255), nullable=False)
    # Roles: super_admin | hospital_admin | doctor | nurse
    role = Column(String(50), default="nurse")
    ward_id = Column(String(50), default="ICU-1")
    hospital_id = Column(String(100), nullable=True)
    phone = Column(String(50), nullable=True)
    is_active = Column(Boolean, default=True)

    def __repr__(self):
        return f"<User {self.email} ({self.role})>"

