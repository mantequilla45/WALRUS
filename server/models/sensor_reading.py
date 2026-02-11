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
    condenser_temp: Optional[float] = Field(None, description="Condenser temperature in Celsius")
    tds_ppm: Optional[int] = Field(None, description="Total Dissolved Solids in PPM")
    water_level_cm: Optional[float] = Field(None, description="Water level in centimeters")
    battery_voltage: Optional[float] = Field(None, description="Battery voltage")
    solar_current: Optional[float] = Field(None, description="Solar panel current in amps")


class ActuatorData(BaseModel):
    """Actuator states from ESP32"""
    pump_active: Optional[bool] = Field(None, description="Pump on/off state")
    fan_active: Optional[bool] = Field(None, description="Fan on/off state")


class ESP32DataPayload(BaseModel):
    """Complete data payload from ESP32"""
    device_id: str = Field(..., description="Unique device identifier")
    sensors: SensorData
    actuators: Optional[ActuatorData] = None
    state: Optional[str] = Field(None, description="System state: Idle, Refilling, Distilling")
    timestamp: Optional[int] = Field(None, description="Unix timestamp")


class SensorReading(BaseModel):
    """Database model for sensor readings"""
    id: Optional[int] = None
    created_at: Optional[datetime] = None
    device_id: str
    basin_temp: Optional[float] = None
    condenser_temp: Optional[float] = None
    tds_ppm: Optional[int] = None
    water_level_cm: Optional[float] = None
    battery_voltage: Optional[float] = None
    solar_current: Optional[float] = None
    system_state: Optional[str] = None
    pump_active: Optional[bool] = None
    fan_active: Optional[bool] = None


class SensorReadingResponse(BaseModel):
    """API response for sensor readings"""
    success: bool
    data: Optional[SensorReading] = None
    message: Optional[str] = None


class HistoricalDataResponse(BaseModel):
    """API response for historical data"""
    success: bool
    data: list[SensorReading] = []
    count: int
    duration: str
