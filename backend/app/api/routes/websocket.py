from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from typing import Dict, Set
import asyncio
import json
import logging
from uuid import UUID

logger = logging.getLogger(__name__)

from ...cv.detector import GestureDetector
from ...cv.gesture_classifier import PatientGestureClassifier
from ..dependencies import get_detector, get_patient, get_patient_classifier
from ...services import patient_service
from ...services.notification import send_nurse_notification
from ...db.session import SessionLocal

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        # Ward ID -> Set of connected nurse dashboard websockets
        self.nurse_connections: Dict[str, Set[WebSocket]] = {}
        # Patient ID -> Camera feed websocket
        self.camera_connections: Dict[str, WebSocket] = {}
        
    async def connect_nurse(self, websocket: WebSocket, ward_id: str):
        await websocket.accept()
        if ward_id not in self.nurse_connections:
            self.nurse_connections[ward_id] = set()
        self.nurse_connections[ward_id].add(websocket)
        
    async def connect_camera(self, websocket: WebSocket, patient_id: str):
        await websocket.accept()
        self.camera_connections[patient_id] = websocket
        
    def disconnect_nurse(self, websocket: WebSocket, ward_id: str):
        if ward_id in self.nurse_connections:
            self.nurse_connections[ward_id].discard(websocket)
            
    async def broadcast_to_ward(self, ward_id: str, message: dict):
        if ward_id in self.nurse_connections:
            dead_connections = set()
            for connection in self.nurse_connections[ward_id]:
                try:
                    await connection.send_json(message)
                except:
                    dead_connections.add(connection)
            self.nurse_connections[ward_id] -= dead_connections

manager = ConnectionManager()

async def update_request_status(request_id: str, status: str, nurse_id: str):
    db = SessionLocal()
    try:
        return patient_service.update_request_status(
            db=db,
            request_id=UUID(request_id),
            status=status,
            nurse_id=nurse_id
        )
    finally:
        db.close()

@router.websocket("/ws/nurse/{ward_id}")
async def nurse_dashboard_websocket(websocket: WebSocket, ward_id: str):
    await manager.connect_nurse(websocket, ward_id)
    try:
        while True:
            data = await websocket.receive_json()
            if data.get("type") == "acknowledge":
                await update_request_status(
                    request_id=data["request_id"],
                    status=data["status"],
                    nurse_id=data["nurse_id"]
                )
    except (WebSocketDisconnect, RuntimeError):
        pass
    finally:
        manager.disconnect_nurse(websocket, ward_id)

@router.websocket("/ws/camera/{patient_id}")
async def camera_feed_websocket(
    websocket: WebSocket, 
    patient_id: str,
    detector: GestureDetector = Depends(get_detector)
):
    await manager.connect_camera(websocket, patient_id)

    # Gracefully look up the patient – don't crash the socket if not found
    try:
        patient_uuid = UUID(patient_id)
    except ValueError:
        await websocket.send_json({"type": "error", "detail": "Invalid patient UUID"})
        await websocket.close()
        return

    try:
        patient = await get_patient(patient_uuid)
    except Exception:
        # Patient not found – keep socket open so UI shows "connected" but skip broadcasts
        patient = None

    classifier = await get_patient_classifier(patient_uuid) if patient else None

    import base64

    try:
        while True:
            # Receive frame – the frontend sends base64 JPEG data URLs as text
            try:
                raw = await websocket.receive_text()
            except Exception:
                # Fallback: try bytes
                raw_bytes = await websocket.receive_bytes()
                raw = None

            # Convert base64 data URL → bytes
            if raw is not None:
                try:
                    # Strip optional "data:image/jpeg;base64," prefix
                    if "," in raw:
                        raw = raw.split(",", 1)[1]
                    frame_data = base64.b64decode(raw)
                except Exception:
                    continue
            else:
                frame_data = raw_bytes

            # Process frame
            metrics = detector.extract_metrics(frame_data)
            
            # Decode, apply landmarks points mask, re-encode, and send back to camera websocket
            try:
                import cv2
                import numpy as np
                nparr = np.frombuffer(frame_data, np.uint8)
                img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                if img is not None:
                    from app.cv.mask_effects import draw_landmarks_mask
                    landmarks = metrics.get("landmarks") if metrics else None
                    if landmarks:
                        img = draw_landmarks_mask(img, landmarks)
                    _, buffer = cv2.imencode('.jpg', img)
                    masked_b64 = base64.b64encode(buffer).decode('utf-8')
                    await websocket.send_json({
                        "type": "processed_frame",
                        "image": f"data:image/jpeg;base64,{masked_b64}"
                    })
            except Exception as e:
                logger.error(f"Error applying landmarks points mask in websocket: {e}")

            # Send telemetry and gesture feedback back to monitor
            if metrics:
                current_active = "resting"
                progress = 0.0
                if classifier:
                    consec = getattr(classifier, "consecutive_frames", 15)
                    if getattr(classifier, "close_frames", 0) > 0:
                        current_active = "eyes_closed"
                        progress = min(1.0, classifier.close_frames / consec)
                    elif getattr(classifier, "open_mouth_frames", 0) > 0:
                        current_active = "mouth_open"
                        progress = min(1.0, classifier.open_mouth_frames / consec)
                    elif getattr(classifier, "head_left_frames", 0) > 0:
                        current_active = "head_left"
                        progress = min(1.0, classifier.head_left_frames / consec)
                    elif getattr(classifier, "head_right_frames", 0) > 0:
                        current_active = "head_right"
                        progress = min(1.0, classifier.head_right_frames / consec)

                await websocket.send_json({
                    "type": "telemetry",
                    "ear": metrics.get("ear", 0.3),
                    "mar": metrics.get("mar", 0.2),
                    "active_gesture": current_active,
                    "progress": progress
                })

            if metrics and classifier and patient:
                result = classifier.process_frame(metrics)
                
                if result:
                    gesture_type, need_type, confidence = result
                    
                    # Create detection record
                    db = SessionLocal()
                    try:
                        detection = patient_service.create_detection(
                            db=db,
                            patient_id=patient_uuid,
                            gesture_type=gesture_type,
                            need_type=need_type,
                            confidence=confidence
                        )
                        
                        # Broadcast to ward nurses
                        await manager.broadcast_to_ward(
                            patient.ward_id,
                            {
                                "type": "new_request",
                                "patient_id": patient_id,
                                "patient_name": patient.name,
                                "bed_number": patient.bed_number,
                                "need": need_type.value,
                                "confidence": confidence,
                                "timestamp": detection.created_at.isoformat(),
                                "request_id": str(detection.id)
                            }
                        )
                        
                        # Send push notification
                        await send_nurse_notification(patient.ward_id, detection)
                    except Exception as e:
                        logger.error(f"Error saving detection: {e}")
                    finally:
                        db.close()
                        
    except (WebSocketDisconnect, RuntimeError):
        pass
    finally:
        if patient_id in manager.camera_connections:
            del manager.camera_connections[patient_id]

