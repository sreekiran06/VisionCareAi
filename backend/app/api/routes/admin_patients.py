from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from ...db.session import get_db
from ...models.patient import Patient
from ...models.audit_log import AuditLog
from ...schemas.schemas import PatientCreate, PatientUpdate, PatientResponse
from ..dependencies import require_admin

router = APIRouter()


def _log(db: Session, actor, action: str, entity_id: str, detail: dict = None, request: Request = None):
    ip = request.client.host if request and request.client else "unknown"
    log = AuditLog(
        user_id=str(actor.id),
        user_email=actor.email,
        user_name=actor.name,
        action=action,
        entity_type="patient",
        entity_id=entity_id,
        detail=detail or {},
        ip_address=ip,
    )
    db.add(log)
    db.commit()


@router.get("/", response_model=List[PatientResponse])
def list_all_patients(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, le=500),
    search: Optional[str] = None,
    hospital_id: Optional[str] = None,
    ward_id: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    q = db.query(Patient)
    if search:
        q = q.filter(Patient.name.ilike(f"%{search}%"))
    if hospital_id:
        q = q.filter(Patient.hospital_id == hospital_id)
    if ward_id:
        q = q.filter(Patient.ward_id == ward_id)
    if is_active is not None:
        q = q.filter(Patient.is_active == is_active)
    return q.offset(skip).limit(limit).all()


@router.post("/", response_model=PatientResponse, status_code=201)
def create_patient(
    payload: PatientCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    patient = Patient(**payload.model_dump())
    db.add(patient)
    db.commit()
    db.refresh(patient)
    _log(db, current_user, "patient_added", str(patient.id), {"name": patient.name}, request)
    return patient


@router.put("/{patient_id}", response_model=PatientResponse)
def update_patient(
    patient_id: UUID,
    payload: PatientUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(patient, field, value)
    db.commit()
    db.refresh(patient)
    _log(db, current_user, "patient_updated", str(patient_id), {}, request)
    return patient


@router.delete("/{patient_id}", status_code=204)
def delete_patient(
    patient_id: UUID,
    request: Request,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    db.delete(patient)
    db.commit()
    _log(db, current_user, "patient_deleted", str(patient_id), {}, request)


@router.patch("/{patient_id}/discharge", response_model=PatientResponse)
def discharge_patient(
    patient_id: UUID,
    request: Request,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    patient.is_active = False
    db.commit()
    db.refresh(patient)
    _log(db, current_user, "patient_discharged", str(patient_id), {"name": patient.name}, request)
    return patient
