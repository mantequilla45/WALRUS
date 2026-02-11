# Project WALRUS - Mobile & Backend Implementation Plan

## System Overview

**Goal**: Create a mobile app and backend server to receive, store, and display real-time data from the ESP32-based WALRUS water purification unit.

### Current Architecture (from docs)
- **ESP32**: Collects sensor data (TDS, temperature, water level, battery voltage)
- **Data Flow**: ESP32 → Wi-Fi → JSON payload → Cloud/Server
- **Sensors**: DS18B20 (temp), TDS sensor, HC-SR04 (ultrasonic), voltage monitor

---

## Proposed Architecture

```
┌─────────────┐
│   ESP32     │ ← Solar-powered water purification unit
│  (Hardware) │    Sensors: TDS, Temp, Level, Battery
└──────┬──────┘
       │ HTTP POST (JSON)
       │ Every 5 minutes
       ▼
┌─────────────────────────────────────────┐
│         BACKEND SERVER                  │
│  (Node.js/Express or Python/FastAPI)    │
│                                         │
│  ┌──────────────┐    ┌──────────────┐  │
│  │ REST API     │    │  Database    │  │
│  │ Endpoints    │◄───┤ (PostgreSQL/ │  │
│  │              │    │  MongoDB)    │  │
│  └──────┬───────┘    └──────────────┘  │
│         │                               │
│  ┌──────▼───────┐                      │
│  │ WebSocket    │ Real-time updates    │
│  │ Server       │                      │
│  └──────────────┘                      │
└─────────┬───────────────────────────────┘
          │ REST API + WebSocket
          ▼
┌─────────────────────┐
│   MOBILE APP        │
│  (React Native)     │
│                     │
│  - Real-time data   │
│  - Historical charts│
│  - Alerts/Status    │
│  - System control   │
└─────────────────────┘
```

---

## Implementation Phases

### Phase 1: Backend Server Setup
**Purpose**: Receive data from ESP32, store it, and provide API for mobile app

#### 1.1 Technology Stack
**Option A - Node.js (Recommended for simplicity)**
- **Runtime**: Node.js + Express.js
- **Database**: PostgreSQL (structured time-series data) or MongoDB (flexible JSON)
- **Real-time**: Socket.IO for WebSocket connections
- **Hosting**: Railway, Render, or DigitalOcean

**Option B - Python (Better for data science/analytics)**
- **Framework**: FastAPI (modern, fast, auto-docs)
- **Database**: PostgreSQL + TimescaleDB (optimized for time-series)
- **Real-time**: FastAPI WebSocket support
- **Hosting**: Railway, Render, or Fly.io

#### 1.2 Backend Features
- **Data Ingestion Endpoint**
  - `POST /api/data` - Receive JSON from ESP32
  - Validate and store sensor readings
  - Timestamp each reading

- **Mobile API Endpoints**
  - `GET /api/latest` - Latest sensor reading
  - `GET /api/history?duration=24h` - Historical data
  - `GET /api/status` - System health status
  - `GET /api/stats` - Analytics (avg TDS, water produced, etc.)

- **Real-time Updates**
  - WebSocket connection for live data streaming
  - Push notifications when thresholds exceeded

- **Database Schema**
  ```sql
  CREATE TABLE sensor_readings (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL,
    basin_temp_celsius DECIMAL(5,2),
    condenser_temp_celsius DECIMAL(5,2),
    tds_ppm INTEGER,
    water_level_cm DECIMAL(5,2),
    battery_voltage DECIMAL(4,2),
    solar_current_amps DECIMAL(5,2),
    system_state VARCHAR(20),  -- Idle, Refilling, Distilling
    pump_status BOOLEAN,
    fan_status BOOLEAN
  );
  ```

#### 1.3 Folder Structure (Node.js Example)
```
server/
├── src/
│   ├── config/
│   │   └── database.js
│   ├── routes/
│   │   ├── esp32.routes.js      # ESP32 data ingestion
│   │   └── mobile.routes.js     # Mobile app API
│   ├── controllers/
│   │   ├── dataController.js
│   │   └── analyticsController.js
│   ├── models/
│   │   └── SensorReading.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── validation.js
│   ├── websocket/
│   │   └── socketHandler.js
│   └── app.js
├── package.json
├── .env
└── README.md
```

---

### Phase 2: ESP32 Integration
**Purpose**: Configure ESP32 to send data to your backend

#### 2.1 ESP32 Code Updates
- Update Wi-Fi connection to point to your backend server
- Modify HTTP POST endpoint from old Next.js dashboard to new backend
- Add retry logic for failed transmissions
- Implement local buffering if server is unreachable

#### 2.2 JSON Payload Format (from ESP32)
```json
{
  "device_id": "WALRUS_001",
  "timestamp": 1707645600,
  "sensors": {
    "basin_temp": 52.3,
    "condenser_temp": 28.5,
    "tds_ppm": 245,
    "water_level_cm": 15.2,
    "battery_voltage": 12.4,
    "solar_current": 1.8
  },
  "actuators": {
    "pump_active": false,
    "fan_active": true
  },
  "state": "Distilling"
}
```

#### 2.3 ESP32 Example Code Snippet
```cpp
// In your ESP32 firmware
const char* serverUrl = "https://your-backend.railway.app/api/data";

void sendTelemetry() {
  HTTPClient http;
  http.begin(serverUrl);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-API-Key", "your-secret-key");

  String payload = buildJsonPayload();  // Your existing function
  int httpResponseCode = http.POST(payload);

  if (httpResponseCode > 0) {
    Serial.printf("Data sent successfully: %d\n", httpResponseCode);
  } else {
    Serial.printf("Error sending data: %s\n", http.errorToString(httpResponseCode).c_str());
  }
  http.end();
}
```

---

### Phase 3: Mobile App Development
**Purpose**: User interface to monitor WALRUS system

#### 3.1 Technology (Already set up)
- **Framework**: React Native (Expo)
- **State Management**: React Context or Zustand
- **Data Fetching**: Axios + React Query (for caching)
- **Real-time**: Socket.IO Client
- **Charts**: react-native-chart-kit or Victory Native

#### 3.2 App Features

**Home Screen**
- Current system status (Idle/Refilling/Distilling)
- Latest sensor readings with icons
- Battery level indicator
- Solar charging status

**Monitor Screen**
- Real-time data cards (TDS, Temperature, Water Level)
- Live graphs showing trends
- Auto-updates via WebSocket

**History Screen**
- Date range selector
- Historical charts (24h, 7d, 30d)
- Export data option

**Alerts Screen**
- Notifications for:
  - Low battery (<11.5V)
  - High TDS (>500 ppm)
  - System faults
  - Maintenance reminders

**Settings Screen**
- Device connection status
- Threshold configurations
- App preferences

#### 3.3 Mobile Folder Structure
```
mobile/
├── app/
│   ├── (tabs)/
│   │   ├── index.tsx              # Home/Dashboard
│   │   ├── monitor.tsx            # Real-time monitoring
│   │   ├── history.tsx            # Historical data
│   │   └── alerts.tsx             # Notifications
│   ├── _layout.tsx
│   └── device/[id].tsx            # Device details
├── components/
│   ├── SensorCard.tsx             # Reusable sensor display
│   ├── LiveChart.tsx              # Real-time graph
│   ├── StatusIndicator.tsx        # System state badge
│   └── BatteryIndicator.tsx       # Battery visual
├── services/
│   ├── api.ts                     # API client (Axios)
│   ├── websocket.ts               # Socket.IO connection
│   └── notifications.ts           # Push notifications
├── hooks/
│   ├── useLatestData.ts           # React Query hook
│   ├── useHistoricalData.ts
│   └── useWebSocket.ts            # Real-time connection
├── context/
│   └── DeviceContext.tsx          # Global device state
├── types/
│   └── index.ts                   # TypeScript types
└── package.json
```

#### 3.4 Key Components Example

**SensorCard Component**
```tsx
interface SensorCardProps {
  label: string;
  value: number;
  unit: string;
  icon: string;
  status: 'normal' | 'warning' | 'critical';
}

export function SensorCard({ label, value, unit, icon, status }: SensorCardProps) {
  return (
    <View style={[styles.card, styles[status]]}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}{unit}</Text>
    </View>
  );
}
```

**API Service**
```typescript
// services/api.ts
import axios from 'axios';

const API_URL = 'https://your-backend.railway.app/api';

export const walrusAPI = {
  getLatest: () => axios.get(`${API_URL}/latest`),
  getHistory: (duration: string) => axios.get(`${API_URL}/history?duration=${duration}`),
  getStatus: () => axios.get(`${API_URL}/status`),
};
```

**WebSocket Hook**
```typescript
// hooks/useWebSocket.ts
import { useEffect, useState } from 'react';
import io from 'socket.io-client';

export function useWebSocket() {
  const [latestData, setLatestData] = useState(null);

  useEffect(() => {
    const socket = io('https://your-backend.railway.app');

    socket.on('sensor-update', (data) => {
      setLatestData(data);
    });

    return () => socket.disconnect();
  }, []);

  return latestData;
}
```

---

### Phase 4: Deployment

#### 4.1 Backend Deployment Options
1. **Railway** (Easiest, free tier available)
   - Connect GitHub repo
   - Auto-deploy on push
   - Built-in PostgreSQL

2. **Render** (Free tier, good performance)
   - Web services + PostgreSQL
   - Auto SSL

3. **DigitalOcean App Platform** (More control)
   - $5/month tier
   - Managed database options

#### 4.2 Mobile Deployment
- **Development**: Expo Go app for testing
- **Production**:
  - iOS: App Store (requires Apple Developer account - $99/year)
  - Android: Google Play Store ($25 one-time fee)
  - Or use Expo's EAS Build for internal distribution

---

## Timeline Estimate

| Phase | Tasks | Duration |
|-------|-------|----------|
| **Phase 1** | Backend setup, database, API endpoints | 1-2 weeks |
| **Phase 2** | ESP32 integration, testing data flow | 3-5 days |
| **Phase 3** | Mobile app UI, API integration, real-time | 2-3 weeks |
| **Phase 4** | Deployment, testing, documentation | 1 week |
| **Total** | | 5-7 weeks |

---

## Data Flow Example

1. **ESP32 collects data** (every 5 minutes)
   ```
   Basin Temp: 52°C
   TDS: 245 ppm
   Battery: 12.4V
   State: Distilling
   ```

2. **ESP32 sends HTTP POST** to backend
   ```
   POST https://walrus-api.railway.app/api/data
   Headers: X-API-Key: secret123
   Body: { ...sensor data... }
   ```

3. **Backend receives, validates, stores** in database
   ```
   INSERT INTO sensor_readings VALUES (...)
   ```

4. **Backend broadcasts via WebSocket** to connected mobile apps
   ```
   socket.emit('sensor-update', latestData)
   ```

5. **Mobile app receives update** and displays
   ```
   UI updates: TDS card shows 245 ppm (Green - Normal)
   Chart updates: New data point added to graph
   ```

---

## Security Considerations

1. **API Authentication**
   - Use API keys for ESP32 requests
   - JWT tokens for mobile app users
   - Rate limiting to prevent abuse

2. **Data Encryption**
   - HTTPS for all communications
   - Encrypt sensitive data in database

3. **Access Control**
   - Multi-device support (each ESP32 has unique ID)
   - User authentication for mobile app

---

## Next Steps

1. **Choose backend technology** (Node.js or Python?)
2. **Set up database** (PostgreSQL or MongoDB?)
3. **Create backend repository** structure
4. **Configure ESP32** to send to new backend
5. **Build mobile app** screens and integrate API
6. **Deploy and test** end-to-end flow

---

## Questions to Decide

1. **Backend Language**: Node.js (easier JS ecosystem) or Python (better data tools)?
2. **Database**: PostgreSQL (structured) or MongoDB (flexible)?
3. **Hosting Budget**: Free tier or paid hosting?
4. **Mobile Features**: Do you need user accounts, or single-device monitoring?
5. **Real-time Priority**: How critical is live data vs. polling every minute?

Let me know your preferences, and I'll help you get started!
