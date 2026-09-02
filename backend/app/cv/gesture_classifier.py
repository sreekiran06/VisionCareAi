from typing import Optional, Tuple, Dict, Any, List
from ..models.gesture import GestureType, NeedType, GestureMapping

class PatientGestureClassifier:
    def __init__(self, mappings: List[GestureMapping], thresholds: Dict[str, float] = None, consecutive_frames: int = 15):
        self.mappings = mappings
        self.thresholds = thresholds or {}
        self.consecutive_frames = consecutive_frames
        
        # State tracking per gesture
        self.close_frames = 0
        self.open_mouth_frames = 0
        self.head_left_frames = 0
        self.head_right_frames = 0
        
        # Double blink tracking
        self.blink_state = "open"  # "open", "closed"
        self.blink_frames = 0
        self.blinks_times: List[int] = []
        self.frame_counter = 0

    def process_frame(self, metrics: Dict[str, Any]) -> Optional[Tuple[GestureType, NeedType, float]]:
        self.frame_counter += 1
        ear = metrics.get("ear", 0.3)
        mar = metrics.get("mar", 0.2)
        yaw_ratio = metrics.get("yaw_ratio", 1.0)
        roll_angle = metrics.get("roll_angle", 0.0)
        
        # Get threshold overrides or use defaults
        ear_thresh = self.thresholds.get("ear_threshold", 0.21)
        mar_thresh = self.thresholds.get("mar_threshold", 0.6)
        
        detected_gesture: Optional[str] = None
        confidence = 0.95
        
        # 1. Check SUSTAINED_CLOSE
        if ear < ear_thresh:
            self.close_frames += 1
            if self.close_frames == self.consecutive_frames:
                detected_gesture = "sustained_close"
        else:
            self.close_frames = 0
            
        # 2. Check MOUTH_OPEN
        if mar > mar_thresh:
            self.open_mouth_frames += 1
            if self.open_mouth_frames == self.consecutive_frames:
                detected_gesture = "mouth_open"
        else:
            self.open_mouth_frames = 0
            
        # 3. Check HEAD_LEFT
        if yaw_ratio > 1.3:
            self.head_left_frames += 1
            if self.head_left_frames == self.consecutive_frames:
                detected_gesture = "head_left"
        else:
            self.head_left_frames = 0
            
        # 4. Check HEAD_RIGHT
        if yaw_ratio < 0.7:
            self.head_right_frames += 1
            if self.head_right_frames == self.consecutive_frames:
                detected_gesture = "head_right"
        else:
            self.head_right_frames = 0

        # 5. Check DOUBLE_BLINK
        if ear < ear_thresh:
            if self.blink_state == "open":
                self.blink_state = "closed"
                self.blink_frames = 0
            self.blink_frames += 1
        else:
            if self.blink_state == "closed":
                if 1 <= self.blink_frames <= 8:
                    self.blinks_times.append(self.frame_counter)
                    self.blinks_times = [t for t in self.blinks_times if self.frame_counter - t <= 30]
                    if len(self.blinks_times) >= 2:
                        detected_gesture = "double_blink"
                        self.blinks_times = []
                self.blink_state = "open"
                self.blink_frames = 0

        if detected_gesture:
            for mapping in self.mappings:
                if mapping.gesture_type == detected_gesture and mapping.is_active:
                    return GestureType(mapping.gesture_type), NeedType(mapping.need_type), confidence
                    
        return None
