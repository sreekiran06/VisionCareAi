from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List

from ...db.session import get_db
from ...models.gesture import GestureMapping
from ...schemas.schemas import GestureMappingCreate, GestureMappingResponse
from ..dependencies import get_current_user

router = APIRouter()

@router.get("", response_model=List[GestureMappingResponse])
def list_mappings(patient_id: UUID, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return db.query(GestureMapping).filter(
        GestureMapping.patient_id == patient_id,
        GestureMapping.is_active == True
    ).all()

@router.post("", response_model=GestureMappingResponse)
def set_mapping(payload: GestureMappingCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    # Deactivate existing mapping for this patient and gesture if it exists
    existing = db.query(GestureMapping).filter(
        GestureMapping.patient_id == payload.patient_id,
        GestureMapping.gesture_type == payload.gesture_type,
        GestureMapping.is_active == True
    ).first()
    
    if existing:
        existing.is_active = False
        
    mapping = GestureMapping(
        patient_id=payload.patient_id,
        gesture_type=payload.gesture_type,
        need_type=payload.need_type,
        custom_threshold=payload.custom_threshold,
        is_active=True
    )
    db.add(mapping)
    db.commit()
    db.refresh(mapping)
    return mapping

@router.delete("/{mapping_id}")
def remove_mapping(mapping_id: UUID, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    mapping = db.query(GestureMapping).filter(GestureMapping.id == mapping_id).first()
    if not mapping:
        raise HTTPException(status_code=404, detail="Mapping not found")
        
    mapping.is_active = False
    db.commit()
    return {"message": "Mapping removed successfully"}
