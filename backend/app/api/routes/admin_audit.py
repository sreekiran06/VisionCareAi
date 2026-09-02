from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from ...db.session import get_db
from ...models.audit_log import AuditLog
from ...schemas.admin_schemas import AuditLogResponse
from ..dependencies import require_admin

router = APIRouter()


@router.get("/", response_model=List[AuditLogResponse])
def list_audit_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, le=500),
    action: Optional[str] = None,
    entity_type: Optional[str] = None,
    user_email: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    q = db.query(AuditLog)
    if action:
        q = q.filter(AuditLog.action.ilike(f"%{action}%"))
    if entity_type:
        q = q.filter(AuditLog.entity_type == entity_type)
    if user_email:
        q = q.filter(AuditLog.user_email.ilike(f"%{user_email}%"))
    if search:
        q = q.filter(
            (AuditLog.action.ilike(f"%{search}%")) |
            (AuditLog.user_name.ilike(f"%{search}%")) |
            (AuditLog.user_email.ilike(f"%{search}%"))
        )
    return q.order_by(AuditLog.created_at.desc()).offset(skip).limit(limit).all()
