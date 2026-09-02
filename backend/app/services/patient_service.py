from sqlalchemy.orm import Session
from uuid import UUID
from datetime import datetime
from typing import List, Optional
from ..models.patient import Patient
from ..models.gesture import GestureMapping
from ..models.detection import Detection, RequestStatus
from ..cv.gesture_classifier import PatientGestureClassifier

def get_patient(db: Session, patient_id: UUID) -> Optional[Patient]:
    return db.query(Patient).filter(Patient.id == patient_id, Patient.is_active == True).first()

def get_patient_classifier(db: Session, patient_id: UUID) -> PatientGestureClassifier:
    patient = get_patient(db, patient_id)
    mappings = db.query(GestureMapping).filter(
        GestureMapping.patient_id == patient_id,
        GestureMapping.is_active == True
    ).all()
    
    thresholds = patient.thresholds if patient else {}
    return PatientGestureClassifier(mappings, thresholds)

def create_detection(
    db: Session,
    patient_id: UUID,
    gesture_type: str,
    need_type: str,
    confidence: float
) -> Detection:
    detection = Detection(
        patient_id=patient_id,
        gesture_type=gesture_type,
        need_type=need_type,
        confidence=confidence,
        status=RequestStatus.PENDING
    )
    db.add(detection)
    db.commit()
    db.refresh(detection)
    return detection

def update_request_status(
    db: Session,
    request_id: UUID,
    status: str,
    nurse_id: str
) -> Optional[Detection]:
    detection = db.query(Detection).filter(Detection.id == request_id).first()
    if not detection:
        return None
        
    detection.status = RequestStatus(status)
    
    if status in [RequestStatus.ACKNOWLEDGED.value, RequestStatus.IN_PROGRESS.value]:
        if not detection.acknowledged_at:
            detection.acknowledged_at = datetime.utcnow()
            detection.acknowledged_by = nurse_id
            dt = detection.acknowledged_at - detection.created_at
            detection.response_time_ms = int(dt.total_seconds() * 1000)
    elif status in [RequestStatus.COMPLETED.value, RequestStatus.CANCELLED.value, RequestStatus.FALSE_POSITIVE.value]:
        if not detection.completed_at:
            detection.completed_at = datetime.utcnow()
            
    if status == RequestStatus.FALSE_POSITIVE.value:
        detection.was_false_positive = True
        
    db.commit()
    db.refresh(detection)
    return detection
