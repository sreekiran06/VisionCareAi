from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from ...db.session import get_db
from ...models.user import User
from ...models.audit_log import AuditLog
from ...schemas.admin_schemas import AdminUserCreate, AdminUserUpdate, AdminUserResponse, ResetPasswordRequest
from ...core.security import get_password_hash
from ..dependencies import get_current_user, require_admin

router = APIRouter()


def _log(db: Session, actor, action: str, entity_id: str, detail: dict = None, request: Request = None):
    ip = request.client.host if request and request.client else "unknown"
    log = AuditLog(
        user_id=str(actor.id),
        user_email=actor.email,
        user_name=actor.name,
        action=action,
        entity_type="user",
        entity_id=entity_id,
        detail=detail or {},
        ip_address=ip,
    )
    db.add(log)
    db.commit()


@router.get("/", response_model=List[AdminUserResponse])
def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, le=200),
    search: Optional[str] = None,
    role: Optional[str] = None,
    hospital_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    q = db.query(User)
    if search:
        q = q.filter(
            (User.name.ilike(f"%{search}%")) | (User.email.ilike(f"%{search}%"))
        )
    if role:
        q = q.filter(User.role == role)
    if hospital_id:
        q = q.filter(User.hospital_id == hospital_id)
    return q.offset(skip).limit(limit).all()


@router.post("/", response_model=AdminUserResponse, status_code=201)
def create_user(
    payload: AdminUserCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    data = payload.model_dump()
    password = data.pop("password")
    user = User(**data, hashed_password=get_password_hash(password))
    db.add(user)
    db.commit()
    db.refresh(user)
    _log(db, current_user, "user_created", str(user.id), {"email": user.email, "role": user.role}, request)
    return user


@router.put("/{user_id}", response_model=AdminUserResponse)
def update_user(
    user_id: UUID,
    payload: AdminUserUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    _log(db, current_user, "user_updated", str(user_id), {}, request)
    return user


@router.delete("/{user_id}", status_code=204)
def delete_user(
    user_id: UUID,
    request: Request,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if str(user.id) == str(current_user.id):
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    db.delete(user)
    db.commit()
    _log(db, current_user, "user_deleted", str(user_id), {"email": user.email}, request)


@router.post("/{user_id}/reset-password", status_code=200)
def reset_password(
    user_id: UUID,
    payload: ResetPasswordRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.hashed_password = get_password_hash(payload.new_password)
    db.commit()
    _log(db, current_user, "password_reset", str(user_id), {}, request)
    return {"message": "Password reset successfully"}


@router.patch("/{user_id}/activate", response_model=AdminUserResponse)
def toggle_activate(
    user_id: UUID,
    request: Request,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = not user.is_active
    db.commit()
    db.refresh(user)
    action = "user_activated" if user.is_active else "user_deactivated"
    _log(db, current_user, action, str(user_id), {}, request)
    return user
