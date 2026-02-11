# ESP32 Data Specification

Reference for all data transmitted by the ESP32 to the backend server.

---

## Connectivity

The ESP32 connects to the internet via a **SIM/LTE cellular module** (no Wi-Fi required).

| Component | Details |
|-----------|---------|
| **Module** | SIM7000G (NB-IoT/LTE Cat-M1) or SIM7600 (4G LTE) |
| **SIM Card** | Prepaid IoT/data SIM with mobile data plan |
| **Interface** | UART (ESP32 TX/RX → SIM module AT commands) |
| **Library** | [TinyGSM](https://github.com/vshymanskyy/TinyGSM) for AT command abstraction |
| **Protocol** | HTTPS POST over cellular data |
| **Frequency** | Every ~5 minutes |
| **Payload size** | ~200 bytes per reading |

The SIM module handles the network connection. The ESP32 sends AT commands to initialize cellular, connect to the APN, and make HTTP requests — the backend sees a normal HTTPS request regardless of transport.

---

## Payload Format

The ESP32 sends a JSON payload via `POST /api/esp32/data` every ~5 minutes.

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

**Headers:**
- `Content-Type: application/json`
- `X-API-Key: <secret>`

---

## Field Reference

### Metadata

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `device_id` | string | Yes | Unique ESP32 identifier (e.g. `"WALRUS_001"`) |
| `timestamp` | int | No | Unix epoch seconds. Server defaults to `NOW()` if omitted |

### Sensors

| Field | Type | Unit | Range | Sensor Hardware |
|-------|------|------|-------|-----------------|
| `basin_temp` | float | °C | 30–80 | DS18B20 temperature probe |
| `condenser_temp` | float | °C | 20–50 | DS18B20 temperature probe |
| `tds_ppm` | int | ppm | 0–1000 | TDS meter module |
| `water_level_cm` | float | cm | 0–30 | HC-SR04 ultrasonic sensor |
| `battery_voltage` | float | V | 10.5–14.0 | Voltage divider + ADC |
| `solar_current` | float | A | 0–5.0 | Current sensor module |

All sensor fields are **optional** (nullable). A partial reading is still accepted.

### Actuators

| Field | Type | Description |
|-------|------|-------------|
| `pump_active` | bool | Water intake/circulation pump state |
| `fan_active` | bool | Condenser cooling fan state |

### System State

| Field | Type | Values |
|-------|------|--------|
| `state` | string | `Idle`, `Refilling`, `Distilling`, `Sleep`, `Fault` |

---

## Status Thresholds

Used by the mobile app to color-code readings.

| Metric | Normal | Warning | Critical |
|--------|--------|---------|----------|
| Basin Temp | < 50°C | 50–55°C | > 55°C |
| TDS | < 300 ppm | 300–500 ppm | > 500 ppm |
| Water Level | > 10 cm | 5–10 cm | < 5 cm |
| Battery | > 12.0V (>60%) | 11.5–12.0V (30–60%) | < 11.5V (<30%) |
| Solar Current | > 1.0A | 0.5–1.0A | < 0.5A |

**Battery percentage formula:** `((voltage - 11.0) / 1.6) * 100`

---

## Database Schema

```sql
CREATE TABLE sensor_readings (
  id            BIGSERIAL PRIMARY KEY,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  device_id     VARCHAR(50) NOT NULL,
  basin_temp    DECIMAL(5,2),
  condenser_temp DECIMAL(5,2),
  tds_ppm       INTEGER,
  water_level_cm DECIMAL(5,2),
  battery_voltage DECIMAL(4,2),
  solar_current  DECIMAL(5,2),
  system_state   VARCHAR(20),
  pump_active    BOOLEAN,
  fan_active     BOOLEAN
);

CREATE INDEX idx_readings_created_at ON sensor_readings(created_at DESC);
CREATE INDEX idx_readings_device_id ON sensor_readings(device_id);
```

---

## API Endpoints

### ESP32 → Backend

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/esp32/data` | Submit a sensor reading |
| `GET` | `/api/esp32/test` | Connection health check |

### Mobile → Backend

| Method | Path | Params | Description |
|--------|------|--------|-------------|
| `GET` | `/api/mobile/latest` | `device_id?` | Latest single reading |
| `GET` | `/api/mobile/history` | `duration` (`1h`,`24h`,`7d`,`30d`), `device_id?` | Array of readings |
| `GET` | `/api/mobile/status` | `device_id?` | Online/offline, warnings |
| `GET` | `/api/mobile/stats` | `duration`, `device_id?` | Min/avg/max aggregates |