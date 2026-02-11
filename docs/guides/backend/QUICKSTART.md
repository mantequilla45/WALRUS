# WALRUS Backend - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Set Up Supabase

1. **Create account**: Go to [supabase.com](https://supabase.com) and sign up
2. **Create project**: Click "New Project"
   - Name: `walrus-backend`
   - Database Password: (save this!)
   - Region: Choose closest to you
   - Wait 2-3 minutes for project to initialize

3. **Create the database table**:
   - Go to SQL Editor in Supabase dashboard
   - Copy and paste this SQL:

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

CREATE INDEX idx_created_at ON sensor_readings(created_at DESC);
CREATE INDEX idx_device_id ON sensor_readings(device_id);
```

4. **Get your API keys**:
   - Go to Settings → API
   - Copy:
     - **Project URL** (looks like `https://xxx.supabase.co`)
     - **anon public** key
     - **service_role** key (click "Reveal" first)

---

### Step 2: Configure Backend Locally

1. **Navigate to server folder**:
```bash
cd server
```

2. **Create virtual environment**:
```bash
python -m venv venv
```

3. **Activate virtual environment**:
```bash
# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate
```

4. **Install dependencies**:
```bash
pip install -r requirements.txt
```

5. **Create .env file**:
```bash
# Copy the example file
cp .env.example .env
```

6. **Edit .env file** with your Supabase credentials:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key-here
SUPABASE_SERVICE_KEY=your-service-role-key-here
ESP32_API_KEY=my-super-secret-esp32-key-12345
ALLOWED_ORIGINS=http://localhost:8081,exp://192.168.1.*
```

---

### Step 3: Test Locally

1. **Start the server**:
```bash
python main.py
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
```

2. **Test the API**:

Open browser and go to: `http://localhost:8000`

You should see:
```json
{
  "status": "online",
  "service": "WALRUS Backend API",
  "version": "1.0.0"
}
```

3. **Test ESP32 endpoint**:

Open a new terminal and run:
```bash
curl -X POST http://localhost:8000/api/esp32/data \
  -H "Content-Type: application/json" \
  -H "X-API-Key: my-super-secret-esp32-key-12345" \
  -d "{\"device_id\":\"WALRUS_001\",\"sensors\":{\"basin_temp\":50.5,\"tds_ppm\":245},\"state\":\"Distilling\"}"
```

You should see a success response!

4. **Check Supabase**:
   - Go to Supabase → Table Editor → sensor_readings
   - You should see your test data! 🎉

---

### Step 4: Deploy to Vercel

1. **Install Vercel CLI**:
```bash
npm install -g vercel
```

2. **Login to Vercel**:
```bash
vercel login
```

3. **Deploy**:
```bash
cd server
vercel
```

Follow the prompts:
- Set up and deploy? **Y**
- Which scope? (choose your account)
- Link to existing project? **N**
- Project name? **walrus-backend**
- In which directory is your code? **.**
- Override settings? **N**

4. **Add environment variables**:
```bash
vercel env add SUPABASE_URL
# Paste your Supabase URL when prompted

vercel env add SUPABASE_KEY
# Paste your anon key

vercel env add SUPABASE_SERVICE_KEY
# Paste your service role key

vercel env add ESP32_API_KEY
# Type your ESP32 secret key
```

5. **Deploy to production**:
```bash
vercel --prod
```

You'll get a URL like: `https://walrus-backend.vercel.app`

6. **Test deployed API**:
```bash
curl https://walrus-backend.vercel.app
```

---

### Step 5: Update ESP32 Code

Update your ESP32 firmware with the new backend URL:

```cpp
// In your ESP32 code
const char* serverUrl = "https://walrus-backend.vercel.app/api/esp32/data";
const char* apiKey = "my-super-secret-esp32-key-12345";

void sendData() {
  HTTPClient http;
  http.begin(serverUrl);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-API-Key", apiKey);

  String jsonPayload = "{...}";  // Your sensor data
  int httpCode = http.POST(jsonPayload);

  if (httpCode > 0) {
    Serial.println("✓ Data sent successfully!");
  }
  http.end();
}
```

---

## 🧪 Testing Checklist

- [ ] Local server runs without errors
- [ ] Can access http://localhost:8000
- [ ] Can send test data via curl/Postman
- [ ] Data appears in Supabase table
- [ ] Vercel deployment successful
- [ ] Can access deployed URL
- [ ] ESP32 can send data to deployed backend

---

## 📱 Next: Mobile App Integration

Once your backend is deployed, update the mobile app to use your API:

```typescript
// In mobile/services/api.ts
const API_URL = 'https://walrus-backend.vercel.app/api/mobile';
```

---

## 🆘 Troubleshooting

**Error: "Module not found"**
- Make sure virtual environment is activated
- Run `pip install -r requirements.txt`

**Error: "Supabase connection failed"**
- Check your `.env` file has correct keys
- Make sure Supabase project is active

**Error: "Invalid API key"**
- Check ESP32_API_KEY in `.env` matches what you're sending
- Make sure X-API-Key header is included in request

**Vercel deployment fails**
- Make sure all environment variables are set
- Check logs: `vercel logs`

---

## 🎉 Success!

Your backend is now ready to:
- ✅ Receive data from ESP32
- ✅ Store in Supabase database
- ✅ Serve data to mobile app
- ✅ Run on Vercel for free!

**Next Steps**:
- Set up the mobile app
- Configure ESP32 to send real data
- Add user authentication (optional)
