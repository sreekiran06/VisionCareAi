from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List, Optional

from ...db.session import get_db
from ...models.patient import Patient
from ...schemas.schemas import PatientCreate, PatientUpdate, PatientResponse
from ..dependencies import get_current_user

router = APIRouter()

@router.get("", response_model=List[PatientResponse])
def list_patients(ward_id: Optional[str] = None, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    query = db.query(Patient).filter(Patient.is_active == True)
    if ward_id:
        query = query.filter(Patient.ward_id == ward_id)
    return query.all()

@router.get("/{patient_id}", response_model=PatientResponse)
def get_patient(patient_id: UUID, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    patient = db.query(Patient).filter(Patient.id == patient_id, Patient.is_active == True).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient

@router.post("", response_model=PatientResponse)
def create_patient(payload: PatientCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    patient = Patient(
        name=payload.name,
        age=payload.age,
        bed_number=payload.bed_number,
        ward_id=payload.ward_id,
        hospital_id=payload.hospital_id,
        condition=payload.condition,
        notes=payload.notes,
        thresholds=payload.thresholds or {}
    )
    db.add(patient)
    db.commit()
    db.refresh(patient)
    return patient

@router.patch("/{patient_id}", response_model=PatientResponse)
def update_patient(patient_id: UUID, payload: PatientUpdate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    patient = db.query(Patient).filter(Patient.id == patient_id, Patient.is_active == True).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
        
    update_data = payload.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(patient, key, value)
        
    db.commit()
    db.refresh(patient)
    return patient

@router.delete("/{patient_id}")
def discharge_patient(patient_id: UUID, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    patient = db.query(Patient).filter(Patient.id == patient_id, Patient.is_active == True).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
        
    patient.is_active = False
    db.commit()
    return {"message": "Patient discharged successfully"}
