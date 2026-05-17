"""
Data Models for Sensor Readings
Pydantic models for request/response validation
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class SensorData(BaseModel):
    """Sensor readings from ESP32"""
    basin_temp: Optional[float] = Field(None, description="Basin temperature in Celsius")
    tds_ppm: Optional[int] = Field(None, description="Total Dissolved Solids in PPM")
    clean_level_cm: Optional[float] = Field(None, description="Clean water collection level in centimeters")
    float_water_detect: Optional[bool] = Field(None, description="Float switch — water present")


class ActuatorData(BaseModel):
    """Actuator states from ESP32"""
    intake_pump_active: Optional[bool] = Field(None, description="Intake pump on/off state")
    collect_pump_active: Optional[bool] = Field(None, description="Collection pump on/off state")
    peltier_active: Optional[bool] = Field(None, description="Peltier (basin heater) on/off state")


class ESP32DataPayload(BaseModel):
    """Complete data payload from ESP32"""
    device_id: str = Field(..., description="Unique device identifier")
    sensors: SensorData
    actuators: Optional[ActuatorData] = None
    state: Optional[str] = Field(None, description="System state, e.g. Monitoring, Distilling, Idle")
    timestamp: Optional[int] = Field(None, description="Unix timestamp")


class SensorReading(BaseModel):
    """Database model for sensor readings"""
    id: Optional[int] = None
    created_at: Optional[datetime] = None
    device_id: str
    basin_temp: Optional[float] = None
    tds_ppm: Optional[int] = None
    clean_level_cm: Optional[float] = None
    intake_pump_active: Optional[bool] = None
    collect_pump_active: Optional[bool] = None
    peltier_active: Optional[bool] = None
    float_water_detect: Optional[bool] = None
    state: Optional[str] = None


class DeviceCommandOverrides(BaseModel):
    """Per-actuator overrides. 'auto' = sensor logic, 'on' = force on, 'off' = force off."""
    intake_pump_override: str = "auto"
    collect_pump_override: str = "auto"
    peltier_override: str = "auto"


class DeviceConfig(BaseModel):
    """Runtime configuration the firmware applies live (no flash needed).
    All time-of-day values are minute-of-day in the device's local timezone (PST)."""
    wake_minute: int = 480                    # 08:00
    sleep_minute: int = 1020                  # 17:00
    peltier_start_minute: int = 630           # 10:30
    peltier_stop_minute: int = 870            # 14:30
    peltier_on_minutes: int = 12
    peltier_cycle_minutes: int = 30
    collect_cycle_minutes: int = 30
    collect_duration_seconds: int = 5
    sync_interval_ms: int = 500


class ESP32CommandsResponse(BaseModel):
    """Exact response shape returned to ESP32 from POST /api/esp32/data (per INTEGRATION.md)."""
    sleep: bool = False
    commands: DeviceCommandOverrides = DeviceCommandOverrides()
    config: DeviceConfig = DeviceConfig()


class SensorReadingResponse(BaseModel):
    """API response for sensor readings (mobile-side endpoints)"""
    success: bool
    data: Optional[SensorReading] = None
    message: Optional[str] = None


class HistoricalDataResponse(BaseModel):
    """API response for historical data"""
    success: bool
    data: list[SensorReading] = []
    count: int
    duration: str
