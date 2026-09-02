import os
import numpy as np
import logging
from typing import Optional, Dict, Any

# OpenCV is optional – detector falls back to mock if unavailable
try:
    import cv2
    CV2_AVAILABLE = True
except Exception:
    cv2 = None  # type: ignore
    CV2_AVAILABLE = False

logger = logging.getLogger(__name__)

# Try to import dlib
try:
    import dlib
    DLIB_AVAILABLE = True
except ImportError:
    DLIB_AVAILABLE = False

# Try to import mediapipe as the modern, lightweight fallback
try:
    import mediapipe as mp
    MEDIAPIPE_AVAILABLE = True
except ImportError:
    MEDIAPIPE_AVAILABLE = False

from .metrics import calculate_ear, calculate_mar, calculate_head_pose
from ..core.config import settings

class GestureDetector:
    def __init__(self, model_path: str = None):
        self.mock_mode = True
        self.detector = None
        self.predictor = None
        self.mp_face_mesh = None
        
        # 1. Try Dlib first
        if DLIB_AVAILABLE:
            model_path = model_path or settings.DETECTOR_MODEL_PATH
            if os.path.exists(model_path):
                try:
                    self.detector = dlib.get_frontal_face_detector()
                    self.predictor = dlib.shape_predictor(model_path)
                    self.mock_mode = False
                    logger.info(f"Loaded dlib shape predictor from {model_path}. Running in Real Mode.")
                    return
                except Exception as e:
                    logger.error(f"Error loading dlib model: {e}")
            else:
                logger.warning(f"Landmark model file not found at {model_path}.")
                
        # 2. Try MediaPipe as premium lightweight real-time fallback
        if MEDIAPIPE_AVAILABLE:
            try:
                self.mp_face_mesh = mp.solutions.face_mesh.FaceMesh(
                    max_num_faces=1,
                    refine_landmarks=True,
                    min_detection_confidence=0.5,
                    min_tracking_confidence=0.5
                )
                self.mock_mode = False
                logger.info("Initialized MediaPipe FaceMesh. Running in Real Mode (MediaPipe Fallback).")
                return
            except Exception as e:
                logger.error(f"Error loading MediaPipe FaceMesh: {e}")
                
        # 3. Fall back to Mock Mode if no libraries are available
        logger.warning("Neither dlib nor MediaPipe is available. GestureDetector will run in Mock Mode.")

    # -- Mock scenario cycling --
    _mock_scenario_index: int = 0
    _mock_frame_in_scenario: int = 0
    _MOCK_SCENARIOS = [
        ("resting", 40, lambda: {
            "ear": __import__("random").uniform(0.26, 0.32),
            "mar": __import__("random").uniform(0.15, 0.22),
            "yaw_ratio": __import__("random").uniform(0.97, 1.03),
            "roll_angle": __import__("random").uniform(-1.5, 1.5),
        }),
        ("sustained_close", 20, lambda: {
            "ear": __import__("random").uniform(0.10, 0.17),
            "mar": __import__("random").uniform(0.15, 0.22),
            "yaw_ratio": __import__("random").uniform(0.97, 1.03),
            "roll_angle": __import__("random").uniform(-1.0, 1.0),
        }),
        ("resting2", 30, lambda: {
            "ear": __import__("random").uniform(0.26, 0.32),
            "mar": __import__("random").uniform(0.15, 0.22),
            "yaw_ratio": __import__("random").uniform(0.97, 1.03),
            "roll_angle": __import__("random").uniform(-1.5, 1.5),
        }),
        ("mouth_open", 20, lambda: {
            "ear": __import__("random").uniform(0.26, 0.32),
            "mar": __import__("random").uniform(0.65, 0.80),
            "yaw_ratio": __import__("random").uniform(0.97, 1.03),
            "roll_angle": __import__("random").uniform(-1.0, 1.0),
        }),
        ("resting3", 30, lambda: {
            "ear": __import__("random").uniform(0.26, 0.32),
            "mar": __import__("random").uniform(0.15, 0.22),
            "yaw_ratio": __import__("random").uniform(0.97, 1.03),
            "roll_angle": __import__("random").uniform(-1.5, 1.5),
        }),
        ("head_left", 20, lambda: {
            "ear": __import__("random").uniform(0.26, 0.32),
            "mar": __import__("random").uniform(0.15, 0.22),
            "yaw_ratio": __import__("random").uniform(1.35, 1.50),
            "roll_angle": __import__("random").uniform(-2.0, 2.0),
        }),
        ("resting4", 30, lambda: {
            "ear": __import__("random").uniform(0.26, 0.32),
            "mar": __import__("random").uniform(0.15, 0.22),
            "yaw_ratio": __import__("random").uniform(0.97, 1.03),
            "roll_angle": __import__("random").uniform(-1.5, 1.5),
        }),
        ("head_right", 20, lambda: {
            "ear": __import__("random").uniform(0.26, 0.32),
            "mar": __import__("random").uniform(0.15, 0.22),
            "yaw_ratio": __import__("random").uniform(0.55, 0.65),
            "roll_angle": __import__("random").uniform(-2.0, 2.0),
        }),
        ("double_blink_close1", 4, lambda: {
            "ear": __import__("random").uniform(0.10, 0.16),
            "mar": __import__("random").uniform(0.15, 0.22),
            "yaw_ratio": __import__("random").uniform(0.97, 1.03),
            "roll_angle": 0.0,
        }),
        ("double_blink_open1", 3, lambda: {
            "ear": __import__("random").uniform(0.26, 0.32),
            "mar": __import__("random").uniform(0.15, 0.22),
            "yaw_ratio": __import__("random").uniform(0.97, 1.03),
            "roll_angle": 0.0,
        }),
        ("double_blink_close2", 4, lambda: {
            "ear": __import__("random").uniform(0.10, 0.16),
            "mar": __import__("random").uniform(0.15, 0.22),
            "yaw_ratio": __import__("random").uniform(0.97, 1.03),
            "roll_angle": 0.0,
        }),
        ("double_blink_open2", 20, lambda: {
            "ear": __import__("random").uniform(0.26, 0.32),
            "mar": __import__("random").uniform(0.15, 0.22),
            "yaw_ratio": __import__("random").uniform(0.97, 1.03),
            "roll_angle": 0.0,
        }),
    ]

    def extract_metrics(self, frame_bytes: bytes) -> Optional[Dict[str, Any]]:
        # If in mock mode, return simulated metrics
        if self.mock_mode:
            scenarios = self.__class__._MOCK_SCENARIOS
            idx = self.__class__._mock_scenario_index % len(scenarios)
            name, num_frames, metrics_fn = scenarios[idx]
            metrics = metrics_fn()
            self.__class__._mock_frame_in_scenario += 1
            if self.__class__._mock_frame_in_scenario >= num_frames:
                self.__class__._mock_frame_in_scenario = 0
                self.__class__._mock_scenario_index = (idx + 1) % len(scenarios)
            return metrics

        # If cv2 is not available, can't decode frames – stay mock
        if not CV2_AVAILABLE or cv2 is None:
            return None

        try:
            nparr = np.frombuffer(frame_bytes, np.uint8)

            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            if img is None:
                return None
                
            # ──── A. Dlib Extraction ────
            if DLIB_AVAILABLE and self.detector is not None:
                gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
                faces = self.detector(gray)
                if not faces:
                    return None
                face = faces[0]
                shape = self.predictor(gray, face)
                landmarks = [(shape.part(i).x, shape.part(i).y) for i in range(68)]
                
                left_ear = calculate_ear(landmarks[36:42])
                right_ear = calculate_ear(landmarks[42:48])
                ear = (left_ear + right_ear) / 2.0
                mar = calculate_mar(landmarks[48:60])
                head_pose = calculate_head_pose(landmarks)
                
                return {
                    "ear": ear,
                    "mar": mar,
                    "yaw_ratio": head_pose["yaw_ratio"],
                    "roll_angle": head_pose["roll_angle"],
                    "landmarks": landmarks
                }
                
            # ──── B. MediaPipe Extraction (No dlib/model dependencies) ────
            if MEDIAPIPE_AVAILABLE and self.mp_face_mesh is not None:
                h, w = img.shape[:2]
                rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
                res = self.mp_face_mesh.process(rgb)
                
                if not res.multi_face_landmarks:
                    return None
                    
                lms = res.multi_face_landmarks[0].landmark
                # Convert normalized landmarks to pixel coords
                pts = [(int(lm.x * w), int(lm.y * h)) for lm in lms]
                
                # Mapped 68 landmarks to match dlib points layout
                mp_to_dlib_indices = [
                    # Jawline (17 points)
                    162, 21, 54, 103, 67, 109, 10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361,
                    # Left eyebrow (5 points)
                    70, 63, 105, 66, 107,
                    # Right eyebrow (5 points)
                    336, 296, 334, 293, 300,
                    # Nose bridge & lower nose (9 points)
                    168, 6, 197, 195, 5, 4, 122, 64, 454,
                    # Left eye (6 points)
                    33, 160, 158, 133, 153, 144,
                    # Right eye (6 points)
                    362, 385, 387, 263, 373, 380,
                    # Outer lips (12 points)
                    61, 37, 0, 267, 291, 321, 17, 91, 14, 87, 13, 312,
                    # Inner lips (8 points)
                    78, 95, 88, 178, 87, 14, 312, 308
                ]
                
                landmarks = [pts[idx] for idx in mp_to_dlib_indices]
                
                # Extract indices for EAR & MAR
                left_eye = [pts[33], pts[160], pts[158], pts[133], pts[153], pts[144]]
                right_eye = [pts[362], pts[385], pts[387], pts[263], pts[373], pts[380]]
                
                left_ear = calculate_ear(left_eye)
                right_ear = calculate_ear(right_eye)
                ear = (left_ear + right_ear) / 2.0
                
                # Outer mouth indices: Left corner 61, Right 291, Top 0, Bottom 17
                d_mouth_v = np.linalg.norm(np.array(pts[0]) - np.array(pts[17]))
                d_mouth_h = np.linalg.norm(np.array(pts[61]) - np.array(pts[291]))
                mar = d_mouth_v / d_mouth_h if d_mouth_h != 0 else 0.0
                
                # Head pose using facial boundaries: Left boundary 234, Right boundary 454, Nose tip 1
                left_dist = np.linalg.norm(np.array(pts[234]) - np.array(pts[1]))
                right_dist = np.linalg.norm(np.array(pts[454]) - np.array(pts[1]))
                yaw_ratio = left_dist / right_dist if right_dist != 0 else 1.0
                
                # Roll using corners of eyes: left corner 33, right corner 263
                dy = pts[263][1] - pts[33][1]
                dx = pts[263][0] - pts[33][0]
                roll_angle = np.degrees(np.arctan2(dy, dx)) if dx != 0 else 0.0
                
                return {
                    "ear": ear,
                    "mar": mar,
                    "yaw_ratio": yaw_ratio,
                    "roll_angle": roll_angle,
                    "landmarks": landmarks
                }
                
        except Exception as e:
            logger.error(f"Error in extract_metrics: {e}")
            
        return None
