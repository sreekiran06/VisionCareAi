try:
    import cv2
except Exception:
    cv2 = None  # type: ignore
import numpy as np


def draw_landmarks_mask(img, landmarks):
    """
    Draws a futuristic skeleton wireframe & points mask on the face.
    Supports both 68-point (dlib/custom) and high-density landmark formats.
    """
    if cv2 is None or img is None or not landmarks:
        return img
    try:
        n = len(landmarks)
        if n == 0:
            return img

        overlay = img.copy()

        # Define connections for 68-point landmarks to form a skeleton wireframe
        if n == 68:
            # Jawline
            cv2.polylines(overlay, [np.array(landmarks[0:17], np.int32)], False, (0, 230, 115), 1, cv2.LINE_AA)
            # Left Eyebrow
            cv2.polylines(overlay, [np.array(landmarks[17:22], np.int32)], False, (0, 165, 239), 1, cv2.LINE_AA)
            # Right Eyebrow
            cv2.polylines(overlay, [np.array(landmarks[22:27], np.int32)], False, (0, 165, 239), 1, cv2.LINE_AA)
            # Nose Bridge
            cv2.polylines(overlay, [np.array(landmarks[27:31], np.int32)], False, (220, 180, 80), 1, cv2.LINE_AA)
            # Lower Nose
            cv2.polylines(overlay, [np.array(landmarks[31:36], np.int32)], True, (220, 180, 80), 1, cv2.LINE_AA)
            # Left Eye
            cv2.polylines(overlay, [np.array(landmarks[36:42], np.int32)], True, (255, 100, 100), 1, cv2.LINE_AA)
            # Right Eye
            cv2.polylines(overlay, [np.array(landmarks[42:48], np.int32)], True, (255, 100, 100), 1, cv2.LINE_AA)
            # Outer Lips
            cv2.polylines(overlay, [np.array(landmarks[48:60], np.int32)], True, (224, 80, 255), 1, cv2.LINE_AA)
            # Inner Lips
            cv2.polylines(overlay, [np.array(landmarks[60:68], np.int32)], True, (224, 80, 255), 1, cv2.LINE_AA)

        # Draw glowing point nodes (dots) for all landmarks
        for i, (x, y) in enumerate(landmarks):
            # Outer glow
            cv2.circle(overlay, (x, y), 3, (0, 255, 255), -1, cv2.LINE_AA)
            # Inner core
            cv2.circle(overlay, (x, y), 1, (255, 255, 255), -1, cv2.LINE_AA)

        # Blend original with wireframe overlay (neon effect)
        cv2.addWeighted(overlay, 0.85, img, 0.15, 0, img)

    except Exception:
        pass
    return img
