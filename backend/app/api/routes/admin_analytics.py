from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone

from ...db.session import get_db
from ...models.alert import Alert
from ...models.patient import Patient
from ...models.camera import Camera
from ...models.hospital import Hospital
from ...schemas.admin_schemas import AnalyticsResponse, TimeSeriesPoint, DistributionPoint
from ..dependencies import require_admin

router = APIRouter()

COLORS = ["#0ea5e9", "#10b981", "#f59e0b", "#f43f5e", "#8b5cf6", "#1C9E9E", "#fb7185", "#34d399"]


@router.get("/", response_model=AnalyticsResponse)
def get_analytics(
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    now = datetime.now(timezone.utc)

    # ── Daily alerts (last 7 days) ───────────────────────────────────────────
    daily_alerts = []
    for i in range(6, -1, -1):
        day = now - timedelta(days=i)
        label = day.strftime("%a")
        count = db.query(Alert).filter(
            Alert.created_at >= day.replace(hour=0, minute=0, second=0, microsecond=0),
            Alert.created_at < (day + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0),
        ).count()
        daily_alerts.append(TimeSeriesPoint(label=label, value=count))

    # ── Weekly alerts (last 8 weeks) ─────────────────────────────────────────
    weekly_alerts = []
    for i in range(7, -1, -1):
        week_start = now - timedelta(weeks=i)
        week_end = week_start + timedelta(weeks=1)
        count = db.query(Alert).filter(
            Alert.created_at >= week_start,
            Alert.created_at < week_end,
        ).count()
        weekly_alerts.append(TimeSeriesPoint(label=f"W{8-i}", value=count))

    # ── Monthly alerts (last 6 months) ───────────────────────────────────────
    monthly_alerts = []
    for i in range(5, -1, -1):
        month = now - timedelta(days=30 * i)
        label = month.strftime("%b")
        count = db.query(Alert).filter(
            Alert.created_at >= month - timedelta(days=15),
            Alert.created_at < month + timedelta(days=15),
        ).count()
        monthly_alerts.append(TimeSeriesPoint(label=label, value=count))

    # ── Patient distribution by condition ────────────────────────────────────
    from sqlalchemy import func
    patient_dist_rows = db.query(Patient.condition, func.count(Patient.id)).group_by(Patient.condition).all()
    patient_distribution = [
        DistributionPoint(name=row[0].value if hasattr(row[0], 'value') else str(row[0]), value=row[1], color=COLORS[i % len(COLORS)])
        for i, row in enumerate(patient_dist_rows)
    ]

    # ── Hospital distribution by patient count ────────────────────────────────
    hospital_dist_rows = db.query(Hospital.name, Hospital.current_patients).order_by(Hospital.current_patients.desc()).limit(8).all()
    hospital_distribution = [
        DistributionPoint(name=row[0], value=row[1], color=COLORS[i % len(COLORS)])
        for i, row in enumerate(hospital_dist_rows)
    ]

    # ── Camera status ─────────────────────────────────────────────────────────
    online = db.query(Camera).filter(Camera.status == "online").count()
    offline = db.query(Camera).filter(Camera.status == "offline").count()
    disconnected = db.query(Camera).filter(Camera.status == "disconnected").count()
    camera_status = [
        DistributionPoint(name="Online", value=online, color="#10b981"),
        DistributionPoint(name="Offline", value=offline, color="#f59e0b"),
        DistributionPoint(name="Disconnected", value=disconnected, color="#f43f5e"),
    ]

    # ── Alert types ───────────────────────────────────────────────────────────
    alert_type_rows = db.query(Alert.alert_type, func.count(Alert.id)).group_by(Alert.alert_type).order_by(func.count(Alert.id).desc()).limit(8).all()
    alert_types = [
        DistributionPoint(name=row[0], value=row[1], color=COLORS[i % len(COLORS)])
        for i, row in enumerate(alert_type_rows)
    ]

    # ── Average response time (simulated) ────────────────────────────────────
    avg_response = [
        TimeSeriesPoint(label=f"W{i+1}", value=round(2 + i * 0.3, 1))
        for i in range(8)
    ]

    return AnalyticsResponse(
        daily_alerts=daily_alerts,
        weekly_alerts=weekly_alerts,
        monthly_alerts=monthly_alerts,
        patient_distribution=patient_distribution,
        hospital_distribution=hospital_distribution,
        camera_status=camera_status,
        alert_types=alert_types,
        avg_response_time=avg_response,
        false_alert_pct=5.2,
    )
