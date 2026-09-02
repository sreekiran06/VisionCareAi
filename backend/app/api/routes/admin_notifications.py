from fastapi import APIRouter, Depends
from ...schemas.admin_schemas import NotificationSettings
from ..dependencies import require_admin

router = APIRouter()

# In-memory store (replace with DB model in production)
_settings_store: dict = {
    "email_enabled": True,
    "sms_enabled": False,
    "alert_threshold_critical": 1,
    "alert_threshold_high": 3,
    "alert_threshold_medium": 5,
    "escalation_time_minutes": 10,
    "emergency_contacts": [],
    "smtp_host": "",
    "smtp_port": 587,
    "smtp_user": "",
    "smtp_password": "",
    "twilio_sid": "",
    "twilio_token": "",
    "twilio_from": "",
}


@router.get("/", response_model=NotificationSettings)
def get_notification_settings(current_user=Depends(require_admin)):
    return NotificationSettings(**_settings_store)


@router.put("/", response_model=NotificationSettings)
def update_notification_settings(
    payload: NotificationSettings,
    current_user=Depends(require_admin),
):
    _settings_store.update(payload.model_dump())
    return NotificationSettings(**_settings_store)
