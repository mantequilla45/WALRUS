# Project WALRUS - Task Checklist

## 📊 Progress Overview

**Last Updated:** February 11, 2026

### Overall Progress Summary

| Phase | Status | Completed | Total | Progress |
|-------|--------|-----------|-------|----------|
| **Pre-Implementation** | ✅ Complete | 9/9 | 9 | 100% |
| **Phase 1: Backend** | 🚧 In Progress | 21/32 | 32 | 66% |
| **Phase 2: ESP32** | ⏳ Pending | 0/14 | 14 | 0% |
| **Phase 3: Mobile** | 🚧 In Progress | 18/52 | 52 | 35% |
| **Phase 4: Deployment** | ⏳ Pending | 0/15 | 15 | 0% |
| **Phase 5: Mobile Deploy** | ⏳ Pending | 0/9 | 9 | 0% |
| **Phase 6: Testing** | ⏳ Pending | 0/15 | 15 | 0% |
| **TOTAL** | 🚧 | **48/146** | **146** | **33%** |

### 🎯 Current Focus

**Backend Development (Phase 1)**
- ✅ Server structure created (Python/FastAPI)
- ✅ All API endpoints coded
- ⏳ Need: Supabase database setup
- ⏳ Need: Test endpoints with real data

**Mobile App (Phase 3)**
- ✅ Dashboard UI complete with simulated data
- ✅ Core components built (SensorCard, StatusBadge, Battery)
- ✅ API service layer ready
- ⏳ Need: Connect to real backend
- ⏳ Need: Build history/alerts screens

### 📝 Next Steps

1. **Set up Supabase database** (15 min)
   - Create account and project
   - Run SQL to create tables
   - Copy credentials to `.env.local`

2. **Test backend locally** (10 min)
   - Run `python main.py`
   - Test endpoints with curl

3. **Connect mobile to backend** (20 min)
   - Update mobile `.env.local` with API URL
   - Replace simulated data with API calls
   - Test on Android emulator

4. **Deploy backend to Vercel** (15 min)
   - Run `vercel` command
   - Set environment variables
   - Test deployed API

---

## Pre-Implementation Setup

### Decision Phase
- [x] Choose backend technology: **Python + FastAPI**
- [x] Choose database: **Supabase (PostgreSQL)**
- [x] Choose hosting provider: **Vercel**
- [x] Decide on authentication strategy: **User Accounts + API Keys**
- [x] Set up project repositories structure

### Repository Setup
- [x] Create `/server` folder in WALRUS repo
- [x] Initialize git for server folder
- [x] Set up `.gitignore` for server
- [x] Create initial `README.md` for server

---

## Phase 1: Backend Server Development

### 1.1 Initial Backend Setup
- [x] Initialize Python project with FastAPI
- [x] Install core dependencies:
  - [x] FastAPI
  - [x] Supabase client (PostgreSQL)
  - [x] python-dotenv (environment variables)
  - [x] CORS middleware
  - [x] Pydantic (validation)
- [x] Create folder structure (`api/`, `config/`, `models/`, `services/`, `middleware/`)
- [x] Set up `.env.example` file template
- [ ] Create `.env.local` file with your credentials
- [x] Create FastAPI server (`main.py` + `api/index.py` for Vercel)
- [ ] Test server runs on localhost (`python main.py`)

### 1.2 Database Setup
- [ ] Create Supabase account and project
- [ ] Create `sensor_readings` table with schema (SQL in backend QUICKSTART.md)
- [ ] Create indexes on `created_at` and `device_id` columns
- [ ] Copy Supabase URL and keys to server `.env.local`
- [ ] Test database connection from backend
- [ ] Set up Row Level Security (RLS) policies (optional)

### 1.3 ESP32 Data Ingestion Endpoint
- [x] Create `api/esp32.py` routes
- [x] Implement `POST /api/esp32/data` endpoint
- [x] Add request validation with Pydantic models
- [x] Add API key authentication middleware
- [x] Parse JSON payload from ESP32
- [x] Insert data into database via Supabase client
- [x] Return success/error response
- [ ] Test endpoint with curl/Postman after database setup

### 1.4 Mobile API Endpoints
- [x] Create `api/mobile.py` routes
- [x] Implement `GET /api/mobile/latest` - latest sensor reading
- [x] Implement `GET /api/mobile/history?duration=24h` - historical data
- [x] Implement `GET /api/mobile/status` - system health
- [x] Implement `GET /api/mobile/stats` - analytics (avg, min, max)
- [x] Add query parameter validation
- [x] Add error handling for all routes
- [ ] Test all endpoints with sample data after database setup

### 1.5 Real-time Updates (Optional - can use polling for now)
- [ ] Set up WebSocket server (FastAPI WebSocket support)
- [ ] Create WebSocket event handlers
- [ ] Emit `sensor-update` event when new data arrives
- [ ] Implement connection authentication
- [ ] Handle client connect/disconnect
- [ ] Test WebSocket connection with a client tool
- **Note:** Mobile app currently uses 5-second polling (simulated data)

### 1.6 Additional Backend Features
- [ ] Add logging (Python logging module)
- [ ] Add rate limiting (slowapi)
- [x] Create health check endpoint (`GET /health`)
- [x] Add CORS configuration
- [x] Auto-generated API docs available at `/docs` (FastAPI feature)
- [ ] Write unit tests for critical endpoints (pytest - optional)

---

## Phase 2: ESP32 Integration

### 2.1 SIM/Cellular Module Setup
- [ ] Choose SIM module (SIM7000G or SIM7600)
- [ ] Wire SIM module to ESP32 (UART TX/RX, power)
- [ ] Install TinyGSM and ArduinoHttpClient libraries
- [ ] Configure APN settings for SIM card provider
- [ ] Test cellular connection (AT commands, signal strength)
- [ ] Verify internet access via SIM module

### 2.2 ESP32 Code Configuration
- [ ] Review existing ESP32 firmware code
- [ ] Initialize SIM module on startup (modem.restart, gprsConnect)
- [ ] Update server URL to point to new backend
- [ ] Update API endpoint path (`/api/esp32/data`)
- [ ] Add API key header to HTTP requests
- [ ] Ensure JSON payload matches expected format (see ESP32_DATA_SPEC.md)
- [ ] Add error handling for failed requests
- [ ] Implement retry logic (3 attempts)
- [ ] Test cellular connection stability

### 2.3 Data Format Validation
- [ ] Verify JSON payload structure
- [ ] Ensure all sensor values are included
- [ ] Add device ID to payload
- [ ] Add timestamp to payload
- [ ] Test with actual ESP32 hardware
- [ ] Verify data appears in database

### 2.4 ESP32 Testing
- [ ] Test data transmission every 5 minutes
- [ ] Verify backend receives and stores data correctly
- [ ] Check for missing or duplicate readings
- [ ] Test behavior when server is offline
- [ ] Test behavior during cellular disconnection / poor signal
- [ ] Test SIM module reconnection after signal loss
- [ ] Monitor ESP32 serial output for errors

---

## Phase 3: Mobile App Development

### 3.1 Project Setup
- [x] Navigate to `/mobile` folder
- [x] Install dependencies (`npm install`)
- [ ] Test app runs on Android (`npm run android`)
- [ ] Install additional packages (when needed):
  - [x] axios (HTTP requests) - added to services/api.ts
  - [ ] @tanstack/react-query (data fetching) - for later
  - [ ] socket.io-client (WebSocket) - optional, using polling for now
  - [ ] react-native-chart-kit (charts) - for history screen
  - [ ] zustand or react-context (state management) - using local state for now
- [x] Create TypeScript types for sensor data (in services/api.ts)

### 3.2 API Service Layer
- [x] Create `services/api.ts`
- [x] Configure Axios instance with base URL (from environment)
- [x] Implement `getLatest()` function
- [x] Implement `getHistory(duration)` function
- [x] Implement `getStatus()` function
- [x] Implement `getStats()` function
- [x] Add error handling and retry logic
- [ ] Test API calls with real backend (after backend deployment)

### 3.3 Real-time Updates (Using polling for now)
- [ ] Create `services/websocket.ts` (optional - WebSocket)
- [ ] Set up Socket.IO client connection (optional)
- [ ] Implement event listeners for `sensor-update` (optional)
- [ ] Handle connection errors and reconnection (optional)
- [ ] Create custom React hook `useWebSocket()` (optional)
- [x] **Alternative:** Using 5-second polling in dashboard (works well for now)
- [ ] Test real-time updates with backend

### 3.4 State Management
- [ ] Create `context/DeviceContext.tsx` or Zustand store (optional for now)
- [x] **Currently:** Using local state (useState) in each screen
- [ ] Define global state shape (latestData, connectionStatus, etc.)
- [ ] Implement actions (updateData, setConnectionStatus)
- [ ] Wrap app with context provider
- [ ] Test state updates across screens
- **Note:** Local state works fine for single-screen prototype

### 3.5 Reusable Components
- [x] Create `components/SensorCard.tsx`
  - [x] Props: label, value, unit, icon, status
  - [x] Conditional styling based on status (normal/warning/critical)
- [x] Create `components/StatusBadge.tsx`
  - [x] Display system state (Idle/Refilling/Distilling/Sleep/Fault)
  - [x] Color-coded badge with icons
- [x] Create `components/BatteryIndicator.tsx`
  - [x] Visual battery level (0-100%)
  - [x] Voltage display, percentage, charging indicator
- [ ] Create `components/LiveChart.tsx` (for history screen)
  - [ ] Line chart for real-time data
  - [ ] Auto-scrolling X-axis

### 3.6 Screen Development

#### Home/Dashboard Screen (`app/(tabs)/index.tsx`)
- [x] Create layout with system status card
- [x] Display latest sensor readings (6 cards: TDS, water level, 2 temps, solar, battery)
- [x] Show battery level indicator with visual meter
- [x] Show solar charging status
- [x] Add last update timestamp
- [x] Add pull-to-refresh functionality
- [x] **Currently:** Using simulated data (updates every 5 seconds)
- [ ] Connect to real backend API
- [ ] Test with live data from ESP32

#### Monitor Screen (`app/(tabs)/monitor.tsx`) - Not started
- [ ] Create real-time data display
- [ ] Implement live charts for:
  - [ ] Basin temperature over time
  - [ ] TDS levels over time
  - [ ] Water level over time
- [ ] Connect to polling or WebSocket for auto-updates
- [ ] Add chart time range selector (5min, 15min, 1hr)
- [ ] Test real-time updates

#### History Screen (`app/(tabs)/history.tsx`) - Not started
- [ ] Create date range picker
- [ ] Fetch historical data based on selected range
- [ ] Display charts for 24h, 7d, 30d views
- [ ] Add data export button (CSV - optional)
- [ ] Show statistics (avg, min, max for each sensor)
- [ ] Add loading and error states

#### Alerts Screen (`app/(tabs)/alerts.tsx`) - Not started
- [ ] Create notification list UI
- [ ] Fetch alerts from backend (if implemented)
- [ ] Display critical events:
  - [ ] Low battery warnings
  - [ ] High TDS warnings
  - [ ] System fault alerts
- [ ] Add notification icon with badge count
- [ ] Mark alerts as read functionality (optional)

#### Settings Screen (optional)
- [ ] Display device connection status
- [ ] Show backend URL (for debugging)
- [ ] Add app version info
- [ ] Allow threshold configuration (optional)
- [ ] Add dark mode toggle (optional)

### 3.7 Mobile Testing
- [ ] Test on iOS simulator/device
- [ ] Test on Android emulator/device
- [ ] Test all API integrations
- [ ] Test real-time updates
- [ ] Test error handling (offline mode)
- [ ] Test performance with large datasets
- [ ] Fix any UI/UX issues

---

## Phase 4: Backend Deployment

### 4.1 Prepare for Deployment
- [ ] Review environment variables
- [ ] Update CORS settings for production
- [ ] Add production database connection string
- [ ] Test with production environment variables locally
- [ ] Create `Procfile` or deployment config

### 4.2 Deploy to Hosting Provider

#### If using Railway:
- [ ] Create Railway account
- [ ] Connect GitHub repository
- [ ] Create new project
- [ ] Add PostgreSQL database service
- [ ] Configure environment variables
- [ ] Deploy backend service
- [ ] Verify deployment logs
- [ ] Test deployed API endpoints

#### If using Render:
- [ ] Create Render account
- [ ] Create new Web Service
- [ ] Connect GitHub repo
- [ ] Configure build/start commands
- [ ] Add PostgreSQL database
- [ ] Set environment variables
- [ ] Deploy service
- [ ] Test endpoints

### 4.3 Configure Database
- [ ] Run database migrations on production DB
- [ ] Verify tables are created
- [ ] Test database connection from deployed backend
- [ ] Set up database backups (if available)

### 4.4 Post-Deployment Testing
- [ ] Test ESP32 can send data to deployed backend
- [ ] Test mobile app can fetch data from deployed backend
- [ ] Test WebSocket connections work
- [ ] Monitor server logs for errors
- [ ] Test API rate limiting
- [ ] Check API response times

---

## Phase 5: Mobile App Deployment

### 5.1 Configure for Production
- [ ] Update API base URL to production backend
- [ ] Remove debug/console logs
- [ ] Test app with production backend
- [ ] Add app icon and splash screen
- [ ] Configure app version in `app.json`
- [ ] Test build locally with EAS Build

### 5.2 Build and Deploy

#### For Internal Testing (Easiest):
- [ ] Use Expo Go for development testing
- [ ] Share QR code with testers
- [ ] No build required

#### For Production (App Stores):
- [ ] Set up EAS account
- [ ] Configure `eas.json`
- [ ] Build for iOS (`eas build --platform ios`)
- [ ] Build for Android (`eas build --platform android`)
- [ ] Download and test builds
- [ ] Submit to App Store (iOS)
- [ ] Submit to Play Store (Android)

---

## Phase 6: Final Integration & Testing

### 6.1 End-to-End Testing
- [ ] Test complete data flow: ESP32 → Backend → Mobile
- [ ] Verify data accuracy (sensor values match)
- [ ] Test real-time updates work consistently
- [ ] Test system under load (multiple requests)
- [ ] Test with poor cellular signal / network conditions
- [ ] Test ESP32 offline/reconnection behavior (SIM module recovery)

### 6.2 Performance Optimization
- [ ] Optimize database queries (add indexes)
- [ ] Implement API response caching (optional)
- [ ] Optimize mobile app bundle size
- [ ] Reduce mobile app memory usage
- [ ] Test battery consumption on mobile

### 6.3 Documentation
- [ ] Document backend API endpoints (README or Swagger)
- [ ] Document ESP32 setup and configuration
- [ ] Document mobile app installation process
- [ ] Create user guide for mobile app (optional)
- [ ] Document environment variables
- [ ] Create troubleshooting guide

### 6.4 Monitoring & Maintenance
- [ ] Set up server uptime monitoring (UptimeRobot - optional)
- [ ] Set up error logging (Sentry - optional)
- [ ] Create backup strategy for database
- [ ] Monitor API usage and costs
- [ ] Plan for future features/improvements

---

## Optional Enhancements (Future)

### Backend Enhancements
- [ ] User authentication and multi-device support
- [ ] Email/SMS alerts for critical events
- [ ] Data export API (CSV, JSON)
- [ ] Admin dashboard (web-based)
- [ ] GraphQL API (instead of REST)
- [ ] Advanced analytics and predictions

### Mobile App Enhancements
- [ ] Push notifications
- [ ] Offline mode with local caching
- [ ] Multiple device monitoring
- [ ] Custom alert thresholds
- [ ] Water production calculator
- [ ] Maintenance reminders
- [ ] Dark mode support
- [ ] Multi-language support

### ESP32 Enhancements
- [ ] OTA (Over-The-Air) firmware updates
- [ ] Remote control commands from mobile app
- [ ] Local data buffering when offline (SD card or SPIFFS)
- [ ] MQTT protocol instead of HTTP (lower overhead for cellular)
- [ ] Edge computing/local analytics
- [ ] SIM card balance/data usage monitoring

---

## Progress Tracking

**Overall Progress: 0/150+ tasks**

- [ ] Phase 1: Backend Server (0/32 tasks)
- [ ] Phase 2: ESP32 Integration (0/14 tasks)
- [ ] Phase 3: Mobile App (0/52 tasks)
- [ ] Phase 4: Backend Deployment (0/15 tasks)
- [ ] Phase 5: Mobile Deployment (0/9 tasks)
- [ ] Phase 6: Testing & Documentation (0/15 tasks)

---

## Notes & Reminders

- Backend URL format: `https://your-app-name.railway.app` or `https://your-app.onrender.com`
- API Key should be stored in `.env` (never commit to git!)
- Test frequently - don't wait until the end
- Use Git branches for features
- Deploy early and often
- Keep backups of your database

**Good luck! 🚀**
