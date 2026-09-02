from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from datetime import datetime, timezone

from ...db.session import get_db
from ...models.camera import Camera
from ...models.audit_log import AuditLog
from ...schemas.admin_schemas import CameraCreate, CameraUpdate, CameraResponse
from ..dependencies import get_current_user, require_admin

router = APIRouter()


def _log(db: Session, actor, action: str, entity_id: str, detail: dict = None, request: Request = None):
    ip = request.client.host if request and request.client else "unknown"
    log = AuditLog(
        user_id=str(actor.id),
        user_email=actor.email,
        user_name=actor.name,
        action=action,
        entity_type="camera",
        entity_id=entity_id,
        detail=detail or {},
        ip_address=ip,
    )
    db.add(log)
    db.commit()


@router.get("/", response_model=List[CameraResponse])
def list_cameras(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, le=500),
    hospital_id: Optional[str] = None,
    status: Optional[str] = None,
    ward: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    q = db.query(Camera)
    if hospital_id:
        q = q.filter(Camera.hospital_id == hospital_id)
    if status:
        q = q.filter(Camera.status == status)
    if ward:
        q = q.filter(Camera.ward.ilike(f"%{ward}%"))
    return q.offset(skip).limit(limit).all()


@router.post("/", response_model=CameraResponse, status_code=201)
def create_camera(
    payload: CameraCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    camera = Camera(**payload.model_dump())
    db.add(camera)
    db.commit()
    db.refresh(camera)
    _log(db, current_user, "camera_added", str(camera.id), {"hospital_id": camera.hospital_id}, request)
    return camera


@router.put("/{camera_id}", response_model=CameraResponse)
def update_camera(
    camera_id: UUID,
    payload: CameraUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    camera = db.query(Camera).filter(Camera.id == camera_id).first()
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(camera, field, value)
    db.commit()
    db.refresh(camera)
    _log(db, current_user, "camera_updated", str(camera_id), {}, request)
    return camera


@router.delete("/{camera_id}", status_code=204)
def delete_camera(
    camera_id: UUID,
    request: Request,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    camera = db.query(Camera).filter(Camera.id == camera_id).first()
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")
    db.delete(camera)
    db.commit()
    _log(db, current_user, "camera_removed", str(camera_id), {}, request)


@router.post("/{camera_id}/restart", status_code=200)
def restart_camera(
    camera_id: UUID,
    request: Request,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    camera = db.query(Camera).filter(Camera.id == camera_id).first()
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")
    # Simulate restart: set status to reconnecting then online
    camera.status = "offline"
    camera.last_connected = datetime.now(timezone.utc).isoformat()
    db.commit()
    _log(db, current_user, "camera_restarted", str(camera_id), {}, request)
    return {"message": "Camera restart initiated"}


@router.post("/{camera_id}/assign-patient", status_code=200)
def assign_patient(
    camera_id: UUID,
    request: Request,
    patient_id: Optional[str] = None,
    patient_name: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    camera = db.query(Camera).filter(Camera.id == camera_id).first()
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")
    camera.patient_id = patient_id
    camera.patient_name = patient_name
    db.commit()
    db.refresh(camera)
    _log(db, current_user, "camera_patient_assigned", str(camera_id), {"patient_id": patient_id}, request)
    return camera
