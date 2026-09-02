# VisionCare AI 👁️

> **Real-time patient monitoring powered by computer vision.**  
> A bedside camera analyses facial landmarks (EAR / MAR / head pose) frame-by-frame, classifies patient gestures, and streams live alerts to a nurse dashboard — with optional email / SMS escalation.

---

## ✨ Features

| Feature | Status |
|---|---|
| Live webcam feed with 24 fps streaming | ✅ |
| Facial landmark points mask (MediaPipe Face Mesh) | ✅ |
| EAR / MAR / Head-pose gesture detection | ✅ |
| Per-patient gesture calibration (3-sample) | ✅ |
| Real-time nurse dashboard with WebSocket alerts | ✅ |
| JWT-secured REST API | ✅ |
| Premium glassmorphism UI (React + TypeScript) | ✅ |
| Email / SMS alert escalation | 🔧 configurable |

---

## 🏗️ Architecture

```
Bedside Camera (React Webcam)
        │  JPEG frames @24 fps
        ▼
/ws/camera/{patient_id}  ──▶  detector.py (MediaPipe FaceMesh / dlib fallback)
                                        │
                               metrics.py  (EAR · MAR · head-pose)
                                        │
                         gesture_classifier.py  (sustained-event tracking)
                                        │
                           notification.py  (alert eval · email/SMS · broadcast)
                                        │
        ┌───────────────────────────────┘
        │  WebSocket push
        ▼
/ws/nurse/{ward_id}  ──▶  Nurse Dashboard (React)
```

REST API (`/api/patients`, `/api/detections`, `/api/auth`) handles CRUD and  
historical queries; WebSockets (`/ws/*`) handle the real-time path.

---

## 🛠️ Tech Stack

### Backend
- **FastAPI** — async REST + WebSocket server
- **SQLAlchemy + SQLite** (dev) / **PostgreSQL** (prod)
- **MediaPipe Face Mesh** — 468-landmark face detection (no C++ build needed)
- **dlib** — optional high-accuracy fallback (requires compiled binaries)
- **OpenCV** (`opencv-contrib-python`) — frame decode / encode / drawing
- **JWT** — RS-256 auth via `python-jose`

### Frontend
- **React 18 + TypeScript**
- **Tailwind CSS** — utility-first design system
- **react-webcam** — 720p live webcam capture at 24 fps
- **recharts** — EAR / MAR telemetry charts
- **WebSocket** — bi-directional frame + telemetry streaming

---

## 🚀 Quick Start (Windows)

### Prerequisites
- Python 3.10+ with `pip`
- Node.js 18+
- Git

### 1 — Clone & install dependencies

```powershell
git clone https://github.com/ManoharGoud27/visioncare_AI.git
cd visioncare_AI
.\install_deps.bat
```

### 2 — Install MediaPipe (face landmark detection)

> ⚠️ **Stop the backend first** before running this.

```powershell
.\install_mediapipe.bat
```

### 3 — Start the backend

```powershell
.\start_backend.bat
# OR manually:
cd backend
.venv\Scripts\uvicorn.exe app.main:app --host 0.0.0.0 --port 8001
```

Look for this line to confirm real face detection is active:
```
Initialized MediaPipe FaceMesh. Running in Real Mode (MediaPipe Fallback).
```

### 4 — Start the frontend

```powershell
.\start_frontend.bat
# OR manually:
cd visioncare-frontend
npm install
npm start
```

Open → **http://localhost:3000**

---

## ⚙️ Configuration

All settings are loaded from environment variables (see `backend/app/core/config.py`).

| Variable | Default | Purpose |
|---|---|---|
| `SECRET_KEY` | `change-me` | JWT signing key — **override in production** |
| `DATABASE_URL` | `sqlite:///./visioncare.db` | Database connection string |
| `EAR_THRESHOLD` | `0.21` | Eye-aspect-ratio threshold for eyes-closed |
| `MAR_THRESHOLD` | `0.50` | Mouth-aspect-ratio threshold for yawn |
| `CONSECUTIVE_FRAMES_ALERT` | `3` | Frames a gesture must persist before alerting |
| `NOTIFICATIONS_ENABLED` | `false` | Enable email/SMS escalation |
| `SMTP_HOST / SMTP_PORT` | — | Email alert channel |
| `TWILIO_*` | — | SMS alert channel |

Create a `.env` file in the `backend/` directory to override defaults:

```env
SECRET_KEY=your-very-secret-key
DATABASE_URL=postgresql://user:pass@localhost:5432/visioncare
NOTIFICATIONS_ENABLED=true
SMTP_HOST=smtp.gmail.com
```

---

## 📡 API Reference

### REST Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/login` | Obtain JWT token |
| `GET` | `/api/patients` | List all patients |
| `POST` | `/api/patients` | Register a new patient |
| `GET` | `/api/patients/{id}` | Get patient details |
| `POST` | `/api/detections` | Save a detection event |
| `GET` | `/api/detections` | List/filter detection history |
| `POST` | `/api/detections/analyze` | Analyze single frame (no persistence) |
| `GET` | `/health` | Health check |
| `GET` | `/docs` | Interactive API docs (Swagger UI) |

### WebSocket Endpoints

| Endpoint | Direction | Purpose |
|---|---|---|
| `WS /ws/camera/{patient_id}` | bidirectional | Bedside device sends JPEG frames; server returns processed frames + telemetry |
| `WS /ws/nurse/{ward_id}` | server→client | Nurse dashboard receives real-time gesture alerts |

#### Camera WebSocket — message types

**Client → Server:** Raw JPEG bytes (base64 or binary)

**Server → Client:**
```json
// Processed frame with landmark mask drawn
{ "type": "processed_frame", "image": "data:image/jpeg;base64,..." }

// Telemetry update
{ "type": "telemetry", "ear": 0.28, "mar": 0.12,
  "active_gesture": "eyes_closed", "progress": 0.67 }
```

---

## 📁 Project Structure

```
visioncare_AI/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── routes/
│   │   │   │   ├── auth.py          # JWT login
│   │   │   │   ├── patients.py      # Patient CRUD
│   │   │   │   ├── detections.py    # Detection history
│   │   │   │   └── websocket.py     # WS camera + nurse handlers
│   │   │   └── dependencies.py      # Shared FastAPI deps (auth, detector)
│   │   ├── cv/
│   │   │   ├── detector.py          # MediaPipe / dlib face landmark engine
│   │   │   ├── metrics.py           # EAR · MAR · head-pose math
│   │   │   ├── gesture_classifier.py# Sustained-event state machine
│   │   │   └── mask_effects.py      # Landmark wireframe drawing
│   │   ├── core/
│   │   │   ├── config.py            # Pydantic settings
│   │   │   └── security.py          # JWT helpers
│   │   ├── db/
│   │   │   └── session.py           # SQLAlchemy engine + session
│   │   ├── models/                  # ORM models (Patient, Detection, User…)
│   │   ├── schemas/                 # Pydantic request/response schemas
│   │   ├── services/
│   │   │   ├── patient_service.py
│   │   │   └── notification.py      # Email / SMS alert dispatch
│   │   └── main.py                  # FastAPI app factory
│   ├── requirements.txt
│   └── Dockerfile
├── visioncare-frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── CameraFeed/          # Live webcam + landmark overlay + HUD
│   │   │   ├── Dashboard/           # NurseDashboard, PatientCard, AlertFeed
│   │   │   ├── Layout/              # Sidebar, AppShell, ThemeToggle
│   │   │   └── UI/                  # StatCard, Badge, Button…
│   │   ├── pages/
│   │   │   ├── Bedside/             # Patient-facing camera page
│   │   │   ├── Calibration/         # 3-sample gesture calibration
│   │   │   ├── Dashboard/           # Nurse overview
│   │   │   ├── Analytics/           # Historical charts
│   │   │   └── Settings/
│   │   ├── services/
│   │   │   ├── api.ts               # Axios REST client
│   │   │   └── websocket.ts         # WS connection manager
│   │   └── types/                   # Shared TypeScript types
│   └── package.json
├── start_backend.bat                 # One-click backend start (Windows)
├── start_frontend.bat                # One-click frontend start (Windows)
├── install_deps.bat                  # Install all Python + Node dependencies
├── install_mediapipe.bat             # Install MediaPipe face mesh
└── docker-compose.yml                # Full-stack Docker Compose
```

---

## 🐳 Docker (Production)

```bash
cp backend/.env.example backend/.env   # edit with your secrets
docker compose up --build
```

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8001 |
| API Docs | http://localhost:8001/docs |
| PostgreSQL | localhost:5432 |

---

## 🙌 Authors

- **ManoharGoud27** — [github.com/ManoharGoud27](https://github.com/ManoharGoud27)

---

## 📄 License

MIT