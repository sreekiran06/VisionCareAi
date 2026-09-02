import numpy as np

def calculate_distance(p1, p2):
    return np.linalg.norm(np.array(p1) - np.array(p2))

def calculate_ear(eye_points):
    # eye_points should be 6 coordinates: p1, p2, p3, p4, p5, p6
    if len(eye_points) < 6:
        return 0.0
    p1, p2, p3, p4, p5, p6 = eye_points[:6]
    a = calculate_distance(p2, p6)
    b = calculate_distance(p3, p5)
    c = calculate_distance(p1, p4)
    if c == 0:
        return 0.0
    return (a + b) / (2.0 * c)

def calculate_mar(mouth_points):
    # mouth_points should be list of coordinates: outer lip
    # Outer lip dlib indices: 48 (index 0) to 59 (index 11)
    # p48 (left corner) = index 0, p54 (right corner) = index 6
    # p51 (upper middle) = index 3, p57 (lower middle) = index 9
    if len(mouth_points) < 12:
        return 0.0
    p48 = mouth_points[0]
    p54 = mouth_points[6]
    p51 = mouth_points[3]
    p57 = mouth_points[9]
    a = calculate_distance(p51, p57)
    b = calculate_distance(p48, p54)
    if b == 0:
        return 0.0
    return a / b

def calculate_head_pose(landmarks):
    # landmarks: list of 68 points (x, y)
    if len(landmarks) < 68:
        return {"yaw_ratio": 1.0, "roll_angle": 0.0}
    
    p0 = landmarks[0]
    p16 = landmarks[16]
    p30 = landmarks[30]
    
    left_dist = calculate_distance(p0, p30)
    right_dist = calculate_distance(p16, p30)
    
    yaw_ratio = left_dist / right_dist if right_dist != 0 else 1.0
    
    p36 = landmarks[36]
    p45 = landmarks[45]
    dy = p45[1] - p36[1]
    dx = p45[0] - p36[0]
    angle = np.degrees(np.arctan2(dy, dx)) if dx != 0 else 0.0
    
    return {
        "yaw_ratio": yaw_ratio,
        "roll_angle": angle
    }
