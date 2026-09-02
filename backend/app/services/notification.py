import logging
import smtplib
from email.mime.text import MIMEText
from ..core.config import settings
from ..models.detection import Detection

logger = logging.getLogger(__name__)

try:
    from twilio.rest import Client as TwilioClient
    TWILIO_AVAILABLE = True
except ImportError:
    TWILIO_AVAILABLE = False

async def send_nurse_notification(ward_id: str, detection: Detection):
    if not settings.NOTIFICATIONS_ENABLED:
        logger.info(f"Notifications disabled. Skipped sending alert for detection: {detection.id}")
        return
        
    message_text = (
        f"ALERT: Patient need detected in Ward {ward_id}. "
        f"Need: {detection.need_type.value.upper()} "
        f"(Gesture: {detection.gesture_type.value}, Confidence: {detection.confidence * 100:.1f}%)"
    )
    
    # 1. Send SMS via Twilio
    if TWILIO_AVAILABLE and settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN and settings.TWILIO_FROM_NUMBER:
        try:
            client = TwilioClient(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
            to_number = "+15555555555"  # Placeholder number for on-duty nurse
            client.messages.create(
                body=message_text,
                from_=settings.TWILIO_FROM_NUMBER,
                to=to_number
            )
            logger.info("SMS notification sent successfully via Twilio.")
        except Exception as e:
            logger.error(f"Failed to send Twilio SMS: {e}")
    else:
        logger.info("Twilio settings missing or library not available. Skipped SMS notification.")

    # 2. Send Email via SMTP
    if settings.SMTP_HOST and settings.SMTP_USER and settings.SMTP_PASSWORD and settings.ALERT_EMAIL_FROM:
        try:
            msg = MIMEText(message_text)
            msg["Subject"] = f"VisionCare Alert - Ward {ward_id}"
            msg["From"] = settings.ALERT_EMAIL_FROM
            msg["To"] = settings.SMTP_USER
            
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                server.starttls()
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.send_message(msg)
            logger.info("Email notification sent successfully via SMTP.")
        except Exception as e:
            logger.error(f"Failed to send email notification: {e}")
    else:
        logger.info("SMTP email settings missing. Skipped email notification.")
