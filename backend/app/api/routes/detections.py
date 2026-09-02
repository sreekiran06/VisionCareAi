from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List, Optional
from pydantic import BaseModel

from ...db.session import get_db
from ...models.detection import Detection, RequestStatus
from ...models.patient import Patient
from ...schemas.schemas import DetectionResponse
from ...services import patient_service
from ..dependencies import get_current_user

router = APIRouter()

class AcknowledgePayload(BaseModel):
    nurse_id: str
    status: str

@router.get("", response_model=List[DetectionResponse])
def list_detections(
    ward_id: str,
    status: Optional[RequestStatus] = None,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    query = db.query(Detection).join(Patient).filter(Patient.ward_id == ward_id)
    
    if status:
        query = query.filter(Detection.status == status)
        
    query = query.order_by(Detection.created_at.desc()).limit(limit)
    return query.all()

@router.patch("/{detection_id}/acknowledge", response_model=DetectionResponse)
def acknowledge_detection(
    detection_id: UUID,
    payload: AcknowledgePayload,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    detection = patient_service.update_request_status(
        db=db,
        request_id=detection_id,
        status=payload.status,
        nurse_id=payload.nurse_id
    )
    if not detection:
        raise HTTPException(status_code=404, detail="Detection request not found")
    return detection
