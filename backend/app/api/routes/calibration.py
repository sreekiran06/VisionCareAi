from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
import base64
from typing import Dict, Any

from ...db.session import get_db
from ...models.patient import Patient
from ...models.gesture import GestureType, CalibrationSample
from ...schemas.schemas import CalibrationSession, CalibrationSampleCreate
from ..dependencies import get_current_user, get_detector

router = APIRouter()

GESTURE_INSTRUCTIONS = {
    GestureType.SUSTAINED_CLOSE: {
        "title": "Sustained Eyes Closed",
        "instruction": "Close your eyes and keep them closed for 3 seconds.",
        "demoVideo": ""
    },
    GestureType.DOUBLE_BLINK: {
        "title": "Double Blink",
        "instruction": "Blink your eyes twice quickly in succession.",
        "demoVideo": ""
    },
    GestureType.MOUTH_OPEN: {
        "title": "Mouth Open",
        "instruction": "Open your mouth wide and hold it open.",
        "demoVideo": ""
    },
    GestureType.HEAD_LEFT: {
        "title": "Head Tilt Left",
        "instruction": "Tilt your head to the left side.",
        "demoVideo": ""
    },
    GestureType.HEAD_RIGHT: {
        "title": "Head Tilt Right",
        "instruction": "Tilt your head to the right side.",
        "demoVideo": ""
    }
}

@router.post("/{patient_id}/start", response_model=CalibrationSession)
def start_calibration(patient_id: UUID, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    patient = db.query(Patient).filter(Patient.id == patient_id, Patient.is_active == True).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
        
    gestures = [
        GestureType.SUSTAINED_CLOSE,
        GestureType.DOUBLE_BLINK,
        GestureType.MOUTH_OPEN,
        GestureType.HEAD_LEFT,
        GestureType.HEAD_RIGHT
    ]
    
    return {
        "patientName": patient.name,
        "gesturesToCalibrate": gestures,
        "instructions": {g: GESTURE_INSTRUCTIONS[g] for g in gestures}
    }

@router.post("/{patient_id}/sample")
def save_calibration_sample(
    patient_id: UUID, 
    payload: CalibrationSampleCreate, 
    db: Session = Depends(get_db), 
    detector = Depends(get_detector),
    current_user = Depends(get_current_user)
):
    patient = db.query(Patient).filter(Patient.id == patient_id, Patient.is_active == True).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
        
    ears = []
    mars = []
    
    for frame_base64 in payload.frames:
        if "," in frame_base64:
            frame_base64 = frame_base64.split(",")[1]
        try:
            frame_bytes = base64.b64decode(frame_base64)
            metrics = detector.extract_metrics(frame_bytes)
            if metrics:
                ears.append(metrics["ear"])
                mars.append(metrics["mar"])
        except Exception:
            pass
            
    avg_ear = sum(ears) / len(ears) if ears else 0.28
    avg_mar = sum(mars) / len(mars) if mars else 0.20
    
    sample = CalibrationSample(
        patient_id=patient_id,
        gesture_type=payload.gesture_type,
        metrics_snapshot={"avg_ear": avg_ear, "avg_mar": avg_mar},
        is_valid=True
    )
    db.add(sample)
    db.commit()
    
    return {"message": "Sample saved successfully", "avg_ear": avg_ear, "avg_mar": avg_mar}

@router.post("/{patient_id}/complete")
def complete_calibration(patient_id: UUID, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    patient = db.query(Patient).filter(Patient.id == patient_id, Patient.is_active == True).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
        
    samples = db.query(CalibrationSample).filter(
        CalibrationSample.patient_id == patient_id,
        CalibrationSample.is_valid == True
    ).all()
    
    ear_threshold = 0.21
    mar_threshold = 0.6
    
    closed_ears = [s.metrics_snapshot["avg_ear"] for s in samples if s.gesture_type == GestureType.SUSTAINED_CLOSE]
    open_mouths = [s.metrics_snapshot["avg_mar"] for s in samples if s.gesture_type == GestureType.MOUTH_OPEN]
    
    if closed_ears:
        ear_threshold = min(0.25, max(0.18, sum(closed_ears) / len(closed_ears) + 0.03))
        
    if open_mouths:
        mar_threshold = min(0.8, max(0.4, (sum(open_mouths) / len(open_mouths)) * 0.8))
        
    patient.thresholds = {
        "ear_threshold": ear_threshold,
        "mar_threshold": mar_threshold
    }
    db.commit()
    
    return {
        "message": "Calibration completed",
        "thresholds": patient.thresholds
    }
