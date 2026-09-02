from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from uuid import UUID
from typing import Optional

from ..core.config import settings
from ..db.session import get_db, SessionLocal
from ..models.user import User
from ..cv.detector import GestureDetector
from ..cv.gesture_classifier import PatientGestureClassifier
from ..services import patient_service

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# Singleton GestureDetector instance so we load models once
detector_instance = GestureDetector()

def get_detector() -> GestureDetector:
    return detector_instance

def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    user = db.query(User).filter(User.email == email, User.is_active == True).first()
    if user is None:
        raise credentials_exception
    return user


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Allow only super_admin and hospital_admin roles."""
    if current_user.role not in ("super_admin", "hospital_admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user


async def get_patient(patient_id: UUID, db: Optional[Session] = None):
    if db is None:
        db_session = SessionLocal()
        try:
            patient = patient_service.get_patient(db_session, patient_id)
        finally:
            db_session.close()
    else:
        patient = patient_service.get_patient(db, patient_id)
        
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient

async def get_patient_classifier(patient_id: UUID, db: Optional[Session] = None) -> PatientGestureClassifier:
    if db is None:
        db_session = SessionLocal()
        try:
            return patient_service.get_patient_classifier(db_session, patient_id)
        finally:
            db_session.close()
    return patient_service.get_patient_classifier(db, patient_id)
