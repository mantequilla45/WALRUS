# Project WALRUS - Task Checklist

## Pre-Implementation Setup

### Decision Phase
- [ ] Choose backend technology (Node.js or Python)
- [ ] Choose database (PostgreSQL or MongoDB)
- [ ] Choose hosting provider (Railway, Render, or DigitalOcean)
- [ ] Decide on authentication strategy (API keys only, or user accounts?)
- [ ] Set up project repositories structure

### Repository Setup
- [ ] Create `/server` folder in WALRUS repo (or separate repo?)
- [ ] Initialize git for server folder
- [ ] Set up `.gitignore` for server
- [ ] Create initial `README.md` for server

---

## Phase 1: Backend Server Development

### 1.1 Initial Backend Setup
- [ ] Initialize Node.js project (`npm init`)
- [ ] Install core dependencies:
  - [ ] Express.js
  - [ ] PostgreSQL client (pg) or MongoDB (mongoose)
  - [ ] dotenv (environment variables)
  - [ ] cors (cross-origin requests)
  - [ ] socket.io (WebSocket)
- [ ] Create folder structure (`src/`, `config/`, `routes/`, `controllers/`, `models/`)
- [ ] Set up `.env` file with database credentials
- [ ] Create basic Express server (`app.js`)
- [ ] Test server runs on localhost

### 1.2 Database Setup
- [ ] Install PostgreSQL locally or set up cloud database
- [ ] Create database named `walrus_db`
- [ ] Create `sensor_readings` table with schema
- [ ] Create indexes on `timestamp` column for performance
- [ ] Test database connection from backend
- [ ] Create database migration files (optional)

### 1.3 ESP32 Data Ingestion Endpoint
- [ ] Create `routes/esp32.routes.js`
- [ ] Implement `POST /api/data` endpoint
- [ ] Add request validation middleware
- [ ] Add API key authentication middleware
- [ ] Parse JSON payload from ESP32
- [ ] Insert data into database
- [ ] Return success/error response
- [ ] Test endpoint with Postman/Thunder Client

### 1.4 Mobile API Endpoints
- [ ] Create `routes/mobile.routes.js`
- [ ] Implement `GET /api/latest` - latest sensor reading
- [ ] Implement `GET /api/history?duration=24h` - historical data
- [ ] Implement `GET /api/status` - system health
- [ ] Implement `GET /api/stats` - analytics (avg, min, max)
- [ ] Add query parameter validation
- [ ] Add error handling for all routes
- [ ] Test all endpoints with sample data

### 1.5 WebSocket Real-time Updates
- [ ] Set up Socket.IO server
- [ ] Create WebSocket event handlers
- [ ] Emit `sensor-update` event when new data arrives
- [ ] Implement connection authentication
- [ ] Handle client connect/disconnect
- [ ] Test WebSocket connection with a client tool

### 1.6 Additional Backend Features
- [ ] Add logging (Winston or Morgan)
- [ ] Add rate limiting (express-rate-limit)
- [ ] Create health check endpoint (`GET /health`)
- [ ] Add CORS configuration
- [ ] Create API documentation (Swagger/OpenAPI - optional)
- [ ] Write unit tests for critical endpoints (optional)

---

## Phase 2: ESP32 Integration

### 2.1 ESP32 Code Configuration
- [ ] Review existing ESP32 firmware code
- [ ] Update server URL to point to new backend
- [ ] Update API endpoint path (`/api/data`)
- [ ] Add API key header to HTTP requests
- [ ] Ensure JSON payload matches expected format
- [ ] Add error handling for failed requests
- [ ] Implement retry logic (3 attempts)
- [ ] Test Wi-Fi connection stability

### 2.2 Data Format Validation
- [ ] Verify JSON payload structure
- [ ] Ensure all sensor values are included
- [ ] Add device ID to payload
- [ ] Add timestamp to payload
- [ ] Test with actual ESP32 hardware
- [ ] Verify data appears in database

### 2.3 ESP32 Testing
- [ ] Test data transmission every 5 minutes
- [ ] Verify backend receives and stores data correctly
- [ ] Check for missing or duplicate readings
- [ ] Test behavior when server is offline
- [ ] Test behavior during Wi-Fi disconnection
- [ ] Monitor ESP32 serial output for errors

---

## Phase 3: Mobile App Development

### 3.1 Project Setup
- [ ] Navigate to `/mobile` folder
- [ ] Install dependencies (`npm install`)
- [ ] Test app runs on Expo Go (`npx expo start`)
- [ ] Install additional packages:
  - [ ] axios (HTTP requests)
  - [ ] @tanstack/react-query (data fetching)
  - [ ] socket.io-client (WebSocket)
  - [ ] react-native-chart-kit (charts)
  - [ ] zustand or react-context (state management)
- [ ] Create TypeScript types for sensor data

### 3.2 API Service Layer
- [ ] Create `services/api.ts`
- [ ] Configure Axios instance with base URL
- [ ] Implement `getLatest()` function
- [ ] Implement `getHistory(duration)` function
- [ ] Implement `getStatus()` function
- [ ] Implement `getStats()` function
- [ ] Add error handling and retry logic
- [ ] Test API calls with mock backend

### 3.3 WebSocket Service
- [ ] Create `services/websocket.ts`
- [ ] Set up Socket.IO client connection
- [ ] Implement event listeners for `sensor-update`
- [ ] Handle connection errors and reconnection
- [ ] Create custom React hook `useWebSocket()`
- [ ] Test real-time updates

### 3.4 State Management
- [ ] Create `context/DeviceContext.tsx` or Zustand store
- [ ] Define global state shape (latestData, connectionStatus, etc.)
- [ ] Implement actions (updateData, setConnectionStatus)
- [ ] Wrap app with context provider
- [ ] Test state updates across screens

### 3.5 Reusable Components
- [ ] Create `components/SensorCard.tsx`
  - [ ] Props: label, value, unit, icon, status
  - [ ] Conditional styling based on status (normal/warning/critical)
- [ ] Create `components/StatusIndicator.tsx`
  - [ ] Display system state (Idle/Refilling/Distilling)
  - [ ] Color-coded badge
- [ ] Create `components/BatteryIndicator.tsx`
  - [ ] Visual battery level (0-100%)
  - [ ] Warning when <20%
- [ ] Create `components/LiveChart.tsx`
  - [ ] Line chart for real-time data
  - [ ] Auto-scrolling X-axis

### 3.6 Screen Development

#### Home/Dashboard Screen (`app/(tabs)/index.tsx`)
- [ ] Create layout with system status card
- [ ] Display latest sensor readings (4-6 cards)
- [ ] Show battery level indicator
- [ ] Show solar charging status
- [ ] Add last update timestamp
- [ ] Add pull-to-refresh functionality
- [ ] Test with live data

#### Monitor Screen (`app/(tabs)/monitor.tsx`)
- [ ] Create real-time data display
- [ ] Implement live charts for:
  - [ ] Basin temperature over time
  - [ ] TDS levels over time
  - [ ] Water level over time
- [ ] Connect to WebSocket for auto-updates
- [ ] Add chart time range selector (5min, 15min, 1hr)
- [ ] Test real-time updates

#### History Screen (`app/(tabs)/history.tsx`)
- [ ] Create date range picker
- [ ] Fetch historical data based on selected range
- [ ] Display charts for 24h, 7d, 30d views
- [ ] Add data export button (CSV - optional)
- [ ] Show statistics (avg, min, max for each sensor)
- [ ] Add loading and error states

#### Alerts Screen (`app/(tabs)/alerts.tsx`)
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
- [ ] Test with poor network conditions
- [ ] Test ESP32 offline/reconnection behavior

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
- [ ] Local data buffering when offline
- [ ] MQTT protocol instead of HTTP
- [ ] Edge computing/local analytics

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
