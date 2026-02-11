# WALRUS Backend Server

Python FastAPI backend for the WALRUS water purification system. This server receives sensor data from ESP32 devices, stores it in Supabase, and provides REST API + WebSocket support for the mobile app.

## Tech Stack

- **Framework**: FastAPI (Python)
- **Database**: Supabase (PostgreSQL)
- **Hosting**: Vercel (Serverless)
- **Authentication**: Supabase Auth
- **Real-time**: Server-Sent Events (SSE)

## Project Structure

```
server/
├── api/
│   ├── __init__.py
│   ├── index.py           # Vercel serverless handler
│   ├── esp32.py           # ESP32 data ingestion endpoints
│   └── mobile.py          # Mobile app endpoints
├── config/
│   ├── __init__.py
│   └── supabase.py        # Supabase client configuration
├── models/
│   ├── __init__.py
│   └── sensor_reading.py  # Data models
├── services/
│   ├── __init__.py
│   └── data_service.py    # Business logic
├── middleware/
│   ├── __init__.py
│   └── auth.py            # Authentication middleware
├── main.py                # Local FastAPI app
├── requirements.txt       # Python dependencies
├── vercel.json           # Vercel configuration
├── .env.example          # Environment variables template
└── README.md             # This file
```

## Setup Instructions

### 1. Prerequisites

- Python 3.9 or higher
- Supabase account
- Vercel account (for deployment)

### 2. Local Development

**Install dependencies:**
```bash
cd server
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

**Set up environment variables:**
```bash
cp .env.example .env
# Edit .env and add your Supabase credentials
```

**Run the development server:**
```bash
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`

### 3. Supabase Setup

**Create a new Supabase project:**
1. Go to https://supabase.com
2. Create a new project
3. Copy your Project URL and API Key

**Create the sensor_readings table:**
```sql
CREATE TABLE sensor_readings (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  device_id VARCHAR(50) NOT NULL,
  basin_temp DECIMAL(5,2),
  condenser_temp DECIMAL(5,2),
  tds_ppm INTEGER,
  water_level_cm DECIMAL(5,2),
  battery_voltage DECIMAL(4,2),
  solar_current DECIMAL(5,2),
  system_state VARCHAR(20),
  pump_active BOOLEAN,
  fan_active BOOLEAN
);

-- Create index for faster queries
CREATE INDEX idx_created_at ON sensor_readings(created_at DESC);
CREATE INDEX idx_device_id ON sensor_readings(device_id);
```

**Set up Row Level Security (RLS):**
```sql
-- Enable RLS
ALTER TABLE sensor_readings ENABLE ROW LEVEL SECURITY;

-- Allow ESP32 to insert (authenticated via API key)
CREATE POLICY "Allow ESP32 insert" ON sensor_readings
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Allow users to read their device data
CREATE POLICY "Allow users to read" ON sensor_readings
  FOR SELECT TO authenticated
  USING (true);
```

### 4. Environment Variables

Create a `.env` file with the following:

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key

# ESP32 Authentication
ESP32_API_KEY=your-secret-esp32-key

# CORS
ALLOWED_ORIGINS=http://localhost:8081,exp://192.168.1.*
```

### 5. Deploy to Vercel

**Install Vercel CLI:**
```bash
npm i -g vercel
```

**Deploy:**
```bash
vercel
```

**Set environment variables in Vercel:**
```bash
vercel env add SUPABASE_URL
vercel env add SUPABASE_KEY
vercel env add SUPABASE_SERVICE_KEY
vercel env add ESP32_API_KEY
```

**Redeploy:**
```bash
vercel --prod
```

## API Endpoints

### ESP32 Endpoints

**POST /api/esp32/data**
- Receive sensor data from ESP32
- Requires `X-API-Key` header
- Body: JSON sensor data

```json
{
  "device_id": "WALRUS_001",
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

### Mobile App Endpoints

**GET /api/mobile/latest**
- Get latest sensor reading
- Requires authentication

**GET /api/mobile/history?duration=24h**
- Get historical data
- Query params: `duration` (1h, 24h, 7d, 30d)

**GET /api/mobile/status**
- Get system health status

**GET /api/mobile/stats**
- Get analytics (avg, min, max)

## Testing

**Test ESP32 endpoint:**
```bash
curl -X POST http://localhost:8000/api/esp32/data \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-secret-esp32-key" \
  -d '{"device_id":"WALRUS_001","sensors":{"basin_temp":50.0}}'
```

**Test mobile endpoint:**
```bash
curl http://localhost:8000/api/mobile/latest
```

## Troubleshooting

**Issue: "Module not found"**
- Make sure virtual environment is activated
- Run `pip install -r requirements.txt`

**Issue: "Supabase connection failed"**
- Check your Supabase URL and keys in `.env`
- Verify your Supabase project is active

**Issue: "CORS error in mobile app"**
- Add your mobile app URL to `ALLOWED_ORIGINS` in `.env`
- Restart the server

## License

Part of Project WALRUS - See main repository for details.
