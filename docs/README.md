# WALRUS Documentation

Complete documentation for the WALRUS (Water Autonomy and Liquid Reclamation Unit, Solar-powered) project.

---

## 📚 Quick Navigation

### 🚀 Getting Started
- **[Task List](TASK_LIST.md)** - Complete checklist for implementation
- **[Implementation Plan](guides/IMPLEMENTATION_PLAN.md)** - System architecture and overview

### 📱 Mobile App Guides
- **[Complete Setup Guide](guides/mobile/COMPLETE_SETUP.md)** - Full mobile app setup (Android Studio, environment, running)
- **[Dashboard Guide](guides/mobile/DASHBOARD.md)** - Understanding the WALRUS dashboard

### 🖥️ Backend/Server Guides
- **[ESP32 Data Spec](guides/ESP32_DATA_SPEC.md)** - Complete sensor payload, fields, thresholds, and DB schema
- **[Backend Quickstart](guides/backend/QUICKSTART.md)** - Fast 5-minute backend setup

### 📄 Thesis Documents
- **[Chapter 1](thesis/PROJECT%20WALRUS-CHAPTER%201.docx)** - Introduction, background, and literature review
- **[Chapter 2](thesis/CHAPTER%202.docx)** - Methodology and system design

---

## 🗂️ Documentation Structure

```
docs/
├── README.md                    ← You are here!
├── TASK_LIST.md                 ← Implementation checklist (keep at root)
│
├── guides/
│   ├── IMPLEMENTATION_PLAN.md   ← System architecture & tech stack
│   │
│   ├── ESP32_DATA_SPEC.md         ← Sensor payload, fields, thresholds, DB schema
│   ├── backend/
│   │   └── QUICKSTART.md        ← Backend setup (Python/FastAPI/Supabase/Vercel)
│   │
│   └── mobile/
│       ├── COMPLETE_SETUP.md    ← Full mobile setup guide
│       └── DASHBOARD.md         ← Dashboard features & usage
│
└── thesis/
    ├── CHAPTER 1.docx           ← Project introduction
    └── CHAPTER 2.docx           ← Methodology
```

---

## 🎯 Where to Start?

### For First-Time Setup:

1. **Read the [Implementation Plan](guides/IMPLEMENTATION_PLAN.md)**
   - Understand system architecture
   - See the data flow (ESP32 → Backend → Mobile)
   - Review technology choices

2. **Follow the [Task List](TASK_LIST.md)**
   - Check off completed items
   - See what's next

3. **Set Up Backend** (if developing server)
   - Follow [Backend Quickstart](guides/backend/QUICKSTART.md)
   - 5-minute setup with Supabase + Vercel

4. **Set Up Mobile** (if developing app)
   - Follow [Complete Setup Guide](guides/mobile/COMPLETE_SETUP.md)
   - Includes Android Studio, environment, and running

---

## 📖 Document Summaries

### Implementation Plan
**File:** `guides/IMPLEMENTATION_PLAN.md`

Complete system architecture document covering:
- ESP32 → Backend → Mobile data flow
- Technology stack decisions
- Database schema
- API endpoints design
- Deployment strategies
- Timeline estimates (5-7 weeks)

### Task List
**File:** `TASK_LIST.md`

150+ actionable tasks organized by phase:
- ✅ Phase 1: Backend Server (32 tasks)
- ✅ Phase 2: ESP32 Integration (14 tasks)
- ✅ Phase 3: Mobile App (52 tasks)
- ✅ Phase 4: Backend Deployment (15 tasks)
- ✅ Phase 5: Mobile Deployment (9 tasks)
- ✅ Phase 6: Testing & Docs (15 tasks)

### Mobile Complete Setup
**File:** `guides/mobile/COMPLETE_SETUP.md`

All-in-one mobile setup guide:
- Android Studio emulator setup
- Dependencies installation
- Environment configuration (.env.local)
- Running on emulator/physical device
- Troubleshooting common errors
- Development workflow

### Dashboard Guide
**File:** `guides/mobile/DASHBOARD.md`

WALRUS mobile dashboard documentation:
- UI components (SensorCard, StatusBadge, BatteryIndicator)
- Simulated data features
- Pull-to-refresh
- Auto-update every 5 seconds
- Color-coded status indicators
- How to connect to real backend

### Backend Quickstart
**File:** `guides/backend/QUICKSTART.md`

Fast backend setup (5 minutes):
- Supabase database setup
- Local server testing
- Vercel deployment
- Environment variables
- ESP32 connection testing

---

## 🏗️ System Overview

### Architecture

```
┌─────────────┐
│   ESP32     │ ← Solar-powered water purification unit
│  + SIM/LTE  │    Sensors: TDS, Temp, Level, Battery
│  (Hardware) │    Connectivity: SIM card (cellular data)
└──────┬──────┘
       │ HTTP POST (JSON) via cellular
       │ Every 5 minutes
       ▼
┌─────────────────────────────────────────┐
│         BACKEND SERVER                  │
│  (Python FastAPI + Supabase)            │
│                                         │
│  - REST API endpoints                   │
│  - PostgreSQL database                  │
│  - Real-time updates                    │
└─────────┬───────────────────────────────┘
          │ REST API
          ▼
┌─────────────────────┐
│   MOBILE APP        │
│  (React Native)     │
│                     │
│  - Real-time data   │
│  - Historical charts│
│  - Alerts/Status    │
└─────────────────────┘
```

### Tech Stack

**Backend:**
- Python + FastAPI
- Supabase (PostgreSQL)
- Vercel (Serverless)

**Mobile:**
- React Native (Expo)
- TypeScript
- Axios + React Query

**Hardware:**
- ESP32 microcontroller
- SIM module (SIM7000G/SIM7600) + prepaid SIM card
- Multiple sensors (TDS, temperature, ultrasonic)
- Solar panel + battery

---

## 📊 Project Status

### ✅ Completed
- [x] Documentation structure
- [x] Backend server architecture
- [x] Mobile app dashboard UI
- [x] API service layer
- [x] Simulated data flow
- [x] Component library (SensorCard, StatusBadge, Battery)

### 🚧 In Progress
- [ ] Backend deployment to Vercel
- [ ] Supabase database setup
- [ ] ESP32 firmware updates
- [ ] Mobile app backend integration

### 📅 Upcoming
- [ ] Historical data charts
- [ ] Push notifications
- [ ] User authentication
- [ ] Multi-device support

---

## 🤝 Contributing

When adding new documentation:

1. **Backend docs** → `guides/backend/`
2. **Mobile docs** → `guides/mobile/`
3. **General guides** → `guides/`
4. **Thesis chapters** → `thesis/`

Keep `TASK_LIST.md` at root for easy access!

---

## 📝 Notes

- All mobile guides assume React Native (Expo) setup
- Backend guides assume Python 3.9+
- Environment files use `.env.local` (gitignored)
- Both mobile and backend use the same Supabase project

---

## 🆘 Need Help?

1. Check the relevant guide first
2. Look for troubleshooting sections
3. Verify environment variables are set
4. Check that dependencies are installed
5. Try clearing cache and rebuilding

**Common Issues:**
- ANDROID_HOME not set → See mobile setup guide
- CORS errors → Check ALLOWED_ORIGINS in backend .env
- Connection errors → Verify backend is running
- Environment vars undefined → Restart app after changing .env

---

## 📚 External Resources

- **Expo Docs:** https://docs.expo.dev/
- **FastAPI Docs:** https://fastapi.tiangolo.com/
- **Supabase Docs:** https://supabase.com/docs
- **React Native:** https://reactnative.dev/
- **Vercel:** https://vercel.com/docs

---

**Last Updated:** February 11, 2026

**Project:** WALRUS - Water Autonomy and Liquid Reclamation Unit, Solar-powered
