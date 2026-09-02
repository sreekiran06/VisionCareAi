import csv
import io
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from ...db.session import get_db
from ...models.alert import Alert
from ...models.audit_log import AuditLog
from ...schemas.admin_schemas import AlertCreate, AlertResponse
from ..dependencies import require_admin

router = APIRouter()


def _log(db: Session, actor, action: str, entity_id: str, detail: dict = None, request: Request = None):
    ip = request.client.host if request and request.client else "unknown"
    log = AuditLog(
        user_id=str(actor.id),
        user_email=actor.email,
        user_name=actor.name,
        action=action,
        entity_type="alert",
        entity_id=entity_id,
        detail=detail or {},
        ip_address=ip,
    )
    db.add(log)
    db.commit()


@router.get("/", response_model=List[AlertResponse])
def list_alerts(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, le=500),
    hospital_id: Optional[str] = None,
    severity: Optional[str] = None,
    status: Optional[str] = None,
    alert_type: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    q = db.query(Alert)
    if hospital_id:
        q = q.filter(Alert.hospital_id == hospital_id)
    if severity:
        q = q.filter(Alert.severity == severity)
    if status:
        q = q.filter(Alert.status == status)
    if alert_type:
        q = q.filter(Alert.alert_type == alert_type)
    if search:
        q = q.filter(
            (Alert.patient_name.ilike(f"%{search}%")) |
            (Alert.hospital_name.ilike(f"%{search}%")) |
            (Alert.alert_type.ilike(f"%{search}%"))
        )
    return q.order_by(Alert.created_at.desc()).offset(skip).limit(limit).all()


@router.post("/", response_model=AlertResponse, status_code=201)
def create_alert(
    payload: AlertCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    alert = Alert(**payload.model_dump())
    db.add(alert)
    db.commit()
    db.refresh(alert)
    _log(db, current_user, "alert_generated", str(alert.id), {"type": alert.alert_type}, request)
    return alert


@router.post("/{alert_id}/acknowledge", response_model=AlertResponse)
def acknowledge_alert(
    alert_id: UUID,
    request: Request,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.status = "acknowledged"
    alert.acknowledged_at = datetime.now(timezone.utc).isoformat()
    db.commit()
    db.refresh(alert)
    _log(db, current_user, "alert_acknowledged", str(alert_id), {}, request)
    return alert


@router.post("/{alert_id}/resolve", response_model=AlertResponse)
def resolve_alert(
    alert_id: UUID,
    request: Request,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.status = "resolved"
    alert.resolved_at = datetime.now(timezone.utc).isoformat()
    db.commit()
    db.refresh(alert)
    _log(db, current_user, "alert_resolved", str(alert_id), {}, request)
    return alert


@router.get("/export/csv")
def export_alerts_csv(
    hospital_id: Optional[str] = None,
    severity: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    q = db.query(Alert)
    if hospital_id:
        q = q.filter(Alert.hospital_id == hospital_id)
    if severity:
        q = q.filter(Alert.severity == severity)
    if status:
        q = q.filter(Alert.status == status)
    alerts = q.order_by(Alert.created_at.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Time", "Patient", "Hospital", "Ward", "Alert Type", "Severity", "Status", "Nurse", "Acknowledged At", "Resolved At"])
    for a in alerts:
        writer.writerow([
            str(a.id), a.created_at.isoformat(), a.patient_name or "", a.hospital_name or "",
            a.ward or "", a.alert_type, a.severity, a.status,
            a.assigned_nurse_name or "", a.acknowledged_at or "", a.resolved_at or "",
        ])
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=alerts_export.csv"},
    )
