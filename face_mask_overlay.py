"""
face_mask_overlay.py  –  Face mask overlay using OpenCV DNN face detection
---------------------------------------------------------------------------
No dlib required. Uses OpenCV's built-in DNN face detector (SSD ResNet)
which works with both opencv-python and opencv-python-headless.

Usage
-----
  python face_mask_overlay.py                         # webcam
  python face_mask_overlay.py --image photo.jpg       # static image
  python face_mask_overlay.py --video clip.mp4        # video file
  python face_mask_overlay.py --mask mask_rgba.png    # custom RGBA mask PNG
  python face_mask_overlay.py --save out.avi          # save output

Controls (webcam / video)
--------------------------
  Q / Esc  – quit
  M        – cycle mask style  (surgical → N95 → fun → emoji)
  +  / -   – opacity up / down
  S        – screenshot
"""

import sys, os, argparse, urllib.request
from datetime import datetime

import numpy as np

# ── OpenCV check ──────────────────────────────────────────────────────────────
try:
    import cv2
except ImportError:
    print("[ERROR] OpenCV not found. Run:\n  backend\\.venv\\Scripts\\pip.exe install opencv-python")
    sys.exit(1)

# ── Arguments ─────────────────────────────────────────────────────────────────
ap = argparse.ArgumentParser()
ap.add_argument("--image", default=None)
ap.add_argument("--video", default=None)
ap.add_argument("--mask",  default=None)
ap.add_argument("--save",  default=None)
ap.add_argument("--cam",   type=int,   default=0)
ap.add_argument("--scale", type=float, default=1.0)
args = ap.parse_args()

# ── DNN face detector (OpenCV built-in SSD ResNet) ────────────────────────────
# We ship a tiny proto + weights via OpenCV's DNN module.
# These files come bundled with recent opencv-python* builds.
_DNN_PROTO   = None
_DNN_WEIGHTS = None

def _find_dnn_files():
    """Look for the bundled DNN face detection model inside the cv2 package."""
    base = os.path.dirname(cv2.__file__)
    candidates = [
        os.path.join(base, "data"),
        os.path.join(base, ".."),
        os.path.join(base, "..", "cv2", "data"),
    ]
    proto_names   = ["opencv_face_detector.pbtxt", "deploy.prototxt"]
    weights_names = ["opencv_face_detector_uint8.pb", "res10_300x300_ssd_iter_140000.caffemodel"]
    for c in candidates:
        for p in proto_names:
            for w in weights_names:
                pf = os.path.join(c, p)
                wf = os.path.join(c, w)
                if os.path.exists(pf) and os.path.exists(wf):
                    return pf, wf
    return None, None


def _download_dnn_models():
    """Download lightweight DNN face detection models to the script directory."""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    proto_path   = os.path.join(script_dir, "deploy.prototxt")
    weights_path = os.path.join(script_dir, "res10_300x300_ssd.caffemodel")

    proto_url   = "https://raw.githubusercontent.com/opencv/opencv/master/samples/dnn/face_detector/deploy.prototxt"
    weights_url = "https://github.com/opencv/opencv_3rdparty/raw/dnn_samples_face_detector_20170830/res10_300x300_ssd_iter_140000.caffemodel"

    if not os.path.exists(proto_path):
        print("[INFO] Downloading face detector proto (~27 KB)…")
        urllib.request.urlretrieve(proto_url, proto_path)
    if not os.path.exists(weights_path):
        print("[INFO] Downloading face detector weights (~10 MB)…")
        urllib.request.urlretrieve(weights_url, weights_path)
    return proto_path, weights_path


# Try to locate model files
_proto, _weights = _find_dnn_files()
if not (_proto and _weights):
    print("[INFO] Bundled DNN model not found – downloading from OpenCV repo…")
    try:
        _proto, _weights = _download_dnn_models()
    except Exception as e:
        print(f"[ERROR] Could not download DNN models: {e}")
        print("  Please connect to the internet and try again.")
        sys.exit(1)

print(f"[INFO] DNN model: {os.path.basename(_weights)}")

# Load model using the most compatible reader
_net = None
_haar = None
_detector_type = "dnn"

try:
    if hasattr(cv2.dnn, "readNet"):
        _net = cv2.dnn.readNet(_weights, _proto)
    elif _proto.endswith(".pbtxt") and _weights.endswith(".pb"):
        _net = cv2.dnn.readNetFromTensorflow(_weights, _proto)
    else:
        _net = cv2.dnn.readNetFromCaffe(_proto, _weights)
    print("[INFO] Face detector ready (OpenCV DNN)")
except Exception as e:
    try:
        if _proto.endswith(".pbtxt") and _weights.endswith(".pb"):
            _net = cv2.dnn.readNetFromTensorflow(_weights, _proto)
        else:
            # Alternate caffe argument order
            _net = cv2.dnn.readNetFromCaffe(_weights, _proto)
        print("[INFO] Face detector ready (OpenCV DNN - alternate loader)")
    except Exception as e2:
        print(f"[WARN] Failed to load DNN: {e2}. Falling back to Haar Cascade.")
        _detector_type = "haar"
        cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        if os.path.exists(cascade_path):
            if hasattr(cv2, "CascadeClassifier"):
                _haar = cv2.CascadeClassifier(cascade_path)
            else:
                # Custom import check
                print("[ERROR] OpenCV installation is corrupted (CascadeClassifier not found). Please reinstall opencv-python.")
                sys.exit(1)
        else:
            print("[ERROR] Haar cascade files not found.")
            sys.exit(1)


def detect_faces(frame: np.ndarray, conf_thresh=0.50):
    """Return list of (x, y, w, h) face bounding boxes."""
    if _detector_type == "haar" and _haar is not None:
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        rects = _haar.detectMultiScale(gray, 1.15, 5, minSize=(60, 60))
        return list(rects) if len(rects) else []
        
    h, w = frame.shape[:2]
    blob = cv2.dnn.blobFromImage(
        cv2.resize(frame, (300, 300)), 1.0, (300, 300),
        (104.0, 177.0, 123.0), swapRB=False, crop=False
    )
    _net.setInput(blob)
    dets = _net.forward()
    faces = []
    for i in range(dets.shape[2]):
        conf = float(dets[0, 0, i, 2])
        if conf >= conf_thresh:
            box = dets[0, 0, i, 3:7] * np.array([w, h, w, h])
            x1, y1, x2, y2 = box.astype(int)
            x1, y1 = max(0, x1), max(0, y1)
            x2, y2 = min(w, x2), min(h, y2)
            if x2 > x1 and y2 > y1:
                faces.append((x1, y1, x2 - x1, y2 - y1))
    return faces



# ── Mask state ────────────────────────────────────────────────────────────────
STYLES   = ["surgical", "n95", "fun", "emoji"]
_style_i = 0
_opacity = 0.88


# ── Drawing helpers ───────────────────────────────────────────────────────────

def _rect(shape, x, y, w, h, xpad=0.08, ystart=0.37, hratio=0.57):
    fh, fw = shape[:2]
    mx = max(0, x - int(w * xpad))
    my = max(0, y + int(h * ystart))
    mw = min(int(w * (1 + 2 * xpad)), fw - mx)
    mh = min(int(h * hratio), fh - my)
    return mx, my, mw, mh


def draw_surgical(ov, x, y, w, h):
    mx, my, mw, mh = _rect(ov.shape, x, y, w, h)
    tc = int(mh * 0.18)
    body = np.array([[mx, my+tc],[mx+mw, my+tc],[mx+mw, my+mh],[mx, my+mh]], np.int32)
    nose = np.array([[mx, my+tc],[mx+int(mw*.35), my],[mx+int(mw*.65), my],[mx+mw, my+tc]], np.int32)
    cv2.fillPoly(ov, [body], (195, 215, 235))
    cv2.fillPoly(ov, [nose], (178, 198, 218))
    for f in (.35, .55, .75):
        fy = my + int(mh*f); s = int(155 + f*30)
        cv2.line(ov, (mx, fy), (mx+mw, fy), (s, s+14, s+28), 2)
    wy = my + tc - 3
    cv2.rectangle(ov, (mx+int(mw*.2), wy), (mx+int(mw*.8), wy+5), (80,90,100), -1)
    sc = my + int(mh*.44); rx = int(w*.13); ry = int(mh*.28)
    cv2.ellipse(ov, (mx,      sc), (rx,ry), 0,  90, 270, (138,160,182), 3)
    cv2.ellipse(ov, (mx+mw,   sc), (rx,ry), 0, -90,  90, (138,160,182), 3)
    cv2.polylines(ov, [body], True, (148,170,194), 1)


def draw_n95(ov, x, y, w, h):
    mx, my, mw, mh = _rect(ov.shape, x, y, w, h, .07, .33, .60)
    cx = mx + mw//2
    shell = np.array([
        [mx,               my+int(mh*.30)],
        [mx+int(mw*.12),   my            ],
        [mx+int(mw*.88),   my            ],
        [mx+mw,            my+int(mh*.30)],
        [mx+mw,            my+mh-int(mh*.10)],
        [mx+int(mw*.85),   my+mh         ],
        [mx+int(mw*.15),   my+mh         ],
        [mx,               my+mh-int(mh*.10)],
    ], np.int32)
    cv2.fillPoly(ov, [shell], (62,67,72))
    sy = my + int(mh*.47)
    cv2.line(ov, (mx+int(mw*.07),sy), (mx+int(mw*.93),sy), (42,47,52), 3)
    vc = (cx, my+int(mh*.64)); vr = int(w*.07)
    cv2.circle(ov, vc, vr, (48,53,58), -1)
    cv2.circle(ov, vc, vr, (78,83,88), 2)
    cv2.line(ov,(vc[0]-vr+3,vc[1]),(vc[0]+vr-3,vc[1]),(78,83,88),2)
    cv2.line(ov,(vc[0],vc[1]-vr+3),(vc[0],vc[1]+vr-3),(78,83,88),2)
    sty = my+int(mh*.33)
    cv2.line(ov,(mx,sty),(x-int(w*.04),y+int(h*.08)),(40,44,48),3)
    cv2.line(ov,(mx+mw,sty),(x+w+int(w*.04),y+int(h*.08)),(40,44,48),3)


def draw_fun(ov, x, y, w, h):
    mx, my, mw, mh = _rect(ov.shape, x, y, w, h, .07, .36, .58)
    tp = int(mh*.20)
    body = np.array([[mx,my+tp],[mx+mw,my+tp],[mx+mw,my+mh],[mx,my+mh]],np.int32)
    cv2.fillPoly(ov,[body],(42,34,190))
    rng = np.random.default_rng(42)
    for _ in range(20):
        sx = int(rng.integers(mx+8, mx+mw-8))
        sy = int(rng.integers(my+tp+4, my+mh-4))
        cr = int(rng.integers(4,10))
        col = [int(c) for c in rng.integers(160,255,3)]
        cv2.circle(ov,(sx,sy),cr,col,-1)
    for f in (.38,.60):
        cv2.line(ov,(mx,my+int(mh*f)),(mx+mw,my+int(mh*f)),(255,200,0),4)
    cv2.ellipse(ov,(mx+mw//2,my+int(mh*.72)),(int(mw*.27),int(mh*.22)),0,0,180,(255,255,255),2)
    sc = my+int(mh*.44)
    cv2.ellipse(ov,(mx,      sc),(int(w*.11),int(mh*.26)),0, 90,270,(25,18,148),3)
    cv2.ellipse(ov,(mx+mw,   sc),(int(w*.11),int(mh*.26)),0,-90, 90,(25,18,148),3)


def draw_emoji(ov, x, y, w, h):
    mx, my, mw, mh = _rect(ov.shape, x, y, w, h, .06, .36, .58)
    tp = int(mh*.18)
    body = np.array([[mx,my+tp],[mx+mw,my+tp],[mx+mw,my+mh],[mx,my+mh]],np.int32)
    cv2.fillPoly(ov,[body],(240,240,240))
    for f in (.38,.58,.78):
        cv2.line(ov,(mx+int(mw*.05),my+int(mh*f)),(mx+int(mw*.95),my+int(mh*f)),(195,195,195),2)
    ey = my - int(h*.07)
    for ex in [x+int(w*.25), x+int(w*.65)]:
        d = int(w*.05)
        cv2.line(ov,(ex-d,ey-d),(ex+d,ey+d),(70,70,70),2)
        cv2.line(ov,(ex+d,ey-d),(ex-d,ey+d),(70,70,70),2)
    sc = my+int(mh*.43)
    cv2.ellipse(ov,(mx,      sc),(int(w*.10),int(mh*.24)),0, 90,270,(180,180,180),3)
    cv2.ellipse(ov,(mx+mw,   sc),(int(w*.10),int(mh*.24)),0,-90, 90,(180,180,180),3)


DRAW = {"surgical": draw_surgical, "n95": draw_n95, "fun": draw_fun, "emoji": draw_emoji}


def apply_png_mask(frame, mask_img, x, y, w, h):
    mx, my, mw, mh = _rect(frame.shape, x, y, w, h)
    if mw <= 0 or mh <= 0: return
    r = cv2.resize(mask_img, (mw, mh), interpolation=cv2.INTER_AREA)
    if r.shape[2] == 4:
        a = r[:,:,3:4]/255.0
        roi = frame[my:my+mh, mx:mx+mw].astype(np.float32)
        frame[my:my+mh, mx:mx+mw] = (a*r[:,:,:3]+(1-a)*roi).astype(np.uint8)
    else:
        frame[my:my+mh, mx:mx+mw] = r


def apply_all(frame, faces, style, custom, alpha):
    for (x,y,w,h) in faces:
        if custom is not None:
            apply_png_mask(frame, custom, x, y, w, h)
        else:
            ov = frame.copy()
            DRAW[style](ov, x, y, w, h)
            cv2.addWeighted(ov, alpha, frame, 1-alpha, 0, frame)


def hud(frame, style, n, alpha):
    w = frame.shape[1]
    bar = np.full((34, w, 3), 18, np.uint8)
    cv2.addWeighted(bar, .70, frame[:34,:w], .30, 0, frame[:34,:w])
    cv2.putText(frame, f"Faces:{n}",               (  8,22), cv2.FONT_HERSHEY_SIMPLEX, .52, (160,220,160), 1, cv2.LINE_AA)
    cv2.putText(frame, f"Style:{style.upper()} [M]",(110,22), cv2.FONT_HERSHEY_SIMPLEX, .52, (190,190,255), 1, cv2.LINE_AA)
    cv2.putText(frame, f"Opacity:{alpha:.0%} [+-]", (330,22), cv2.FONT_HERSHEY_SIMPLEX, .52, (255,210,130), 1, cv2.LINE_AA)
    cv2.putText(frame, "S=save Q=quit",             (520,22), cv2.FONT_HERSHEY_SIMPLEX, .52, (140,140,140), 1, cv2.LINE_AA)


# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    global _style_i, _opacity

    custom = None
    if args.mask:
        custom = cv2.imread(args.mask, cv2.IMREAD_UNCHANGED)
        if custom is None:
            print(f"[ERROR] Cannot load mask image: {args.mask}")
            sys.exit(1)

    # Image mode
    if args.image:
        img = cv2.imread(args.image)
        if img is None:
            print(f"[ERROR] Cannot open: {args.image}")
            sys.exit(1)
        if args.scale != 1.0:
            img = cv2.resize(img, None, fx=args.scale, fy=args.scale)
        faces = detect_faces(img)
        print(f"[INFO] {len(faces)} face(s) detected")
        apply_all(img, faces, STYLES[_style_i], custom, _opacity)
        out = args.save or "masked_output.jpg"
        cv2.imwrite(out, img)
        print(f"[INFO] Saved → {out}")
        cv2.imshow("Face Mask", img)
        cv2.waitKey(0)
        cv2.destroyAllWindows()
        return

    # Webcam / video mode
    src = args.video if args.video else args.cam
    cap = cv2.VideoCapture(src)
    if not cap.isOpened():
        print(f"[ERROR] Cannot open: {src}")
        sys.exit(1)

    fw = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    fh = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    print(f"[INFO] {fw}x{fh} @ {fps:.1f}fps  |  Controls: M=style +/-=opacity S=screenshot Q=quit")

    writer = None
    if args.save:
        writer = cv2.VideoWriter(args.save, cv2.VideoWriter_fourcc(*"mp4v"), fps, (fw, fh))

    while True:
        ret, frame = cap.read()
        if not ret: break
        if args.scale != 1.0:
            frame = cv2.resize(frame, None, fx=args.scale, fy=args.scale)

        faces = detect_faces(frame)
        apply_all(frame, faces, STYLES[_style_i], custom, _opacity)
        hud(frame, STYLES[_style_i], len(faces), _opacity)

        if writer: writer.write(frame)
        cv2.imshow("VisionCare — Face Mask", frame)
        k = cv2.waitKey(1) & 0xFF

        if k in (ord('q'), 27): break
        elif k == ord('m'):
            _style_i = (_style_i + 1) % len(STYLES)
            print(f"Style → {STYLES[_style_i]}")
        elif k in (ord('+'), ord('=')): _opacity = min(1.0, _opacity + 0.05)
        elif k == ord('-'):             _opacity = max(0.1, _opacity - 0.05)
        elif k == ord('s'):
            name = f"screenshot_{datetime.now().strftime('%Y%m%d_%H%M%S')}.jpg"
            cv2.imwrite(name, frame)
            print(f"Screenshot → {name}")

    cap.release()
    if writer: writer.release()
    cv2.destroyAllWindows()
    print("Done.")


if __name__ == "__main__":
    main()
