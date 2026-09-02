from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from ...db.session import get_db
from ...models.hospital import Hospital
from ...models.audit_log import AuditLog
from ...schemas.admin_schemas import HospitalCreate, HospitalUpdate, HospitalResponse
from ..dependencies import get_current_user, require_admin

router = APIRouter()


def _log(db: Session, user, action: str, entity_type: str, entity_id: str, detail: dict = None, request: Request = None):
    ip = request.client.host if request and request.client else "unknown"
    log = AuditLog(
        user_id=str(user.id),
        user_email=user.email,
        user_name=user.name,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        detail=detail or {},
        ip_address=ip,
    )
    db.add(log)
    db.commit()


@router.get("/", response_model=List[HospitalResponse])
def list_hospitals(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, le=200),
    search: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    q = db.query(Hospital)
    if search:
        q = q.filter(Hospital.name.ilike(f"%{search}%"))
    if status:
        q = q.filter(Hospital.status == status)
    return q.offset(skip).limit(limit).all()


@router.post("/", response_model=HospitalResponse, status_code=201)
def create_hospital(
    payload: HospitalCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    hospital = Hospital(**payload.model_dump())
    db.add(hospital)
    db.commit()
    db.refresh(hospital)
    _log(db, current_user, "hospital_created", "hospital", str(hospital.id), {"name": hospital.name}, request)
    return hospital


@router.put("/{hospital_id}", response_model=HospitalResponse)
def update_hospital(
    hospital_id: UUID,
    payload: HospitalUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    hospital = db.query(Hospital).filter(Hospital.id == hospital_id).first()
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(hospital, field, value)
    db.commit()
    db.refresh(hospital)
    _log(db, current_user, "hospital_updated", "hospital", str(hospital_id), {}, request)
    return hospital


@router.delete("/{hospital_id}", status_code=204)
def delete_hospital(
    hospital_id: UUID,
    request: Request,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    hospital = db.query(Hospital).filter(Hospital.id == hospital_id).first()
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")
    db.delete(hospital)
    db.commit()
    _log(db, current_user, "hospital_deleted", "hospital", str(hospital_id), {}, request)


@router.patch("/{hospital_id}/toggle-status", response_model=HospitalResponse)
def toggle_hospital_status(
    hospital_id: UUID,
    request: Request,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    hospital = db.query(Hospital).filter(Hospital.id == hospital_id).first()
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")
    hospital.status = "suspended" if hospital.status == "active" else "active"
    db.commit()
    db.refresh(hospital)
    _log(db, current_user, "hospital_status_toggled", "hospital", str(hospital_id), {"new_status": hospital.status}, request)
    return hospital
