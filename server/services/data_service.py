"""
Data Service
Business logic for storing and retrieving sensor data
"""

from datetime import datetime, timedelta
from typing import List, Optional
from config.supabase import get_supabase_admin
from models.sensor_reading import ESP32DataPayload, SensorReading


class DataService:
    """Service for handling sensor data operations"""

    def __init__(self):
        self.supabase = get_supabase_admin()
        self.table_name = "sensor_readings"

    async def store_sensor_data(self, payload: ESP32DataPayload) -> SensorReading:
        """
        Store sensor data in Supabase

        Args:
            payload: ESP32 data payload

        Returns:
            The stored sensor reading
        """
        # Prepare data for insertion
        data = {
            "device_id": payload.device_id,
            "basin_temp": payload.sensors.basin_temp,
            "condenser_temp": payload.sensors.condenser_temp,
            "tds_ppm": payload.sensors.tds_ppm,
            "water_level_cm": payload.sensors.water_level_cm,
            "battery_voltage": payload.sensors.battery_voltage,
            "solar_current": payload.sensors.solar_current,
            "system_state": payload.state,
        }

        # Add actuator data if present
        if payload.actuators:
            data["pump_active"] = payload.actuators.pump_active
            data["fan_active"] = payload.actuators.fan_active

        # Insert into Supabase
        result = self.supabase.table(self.table_name).insert(data).execute()

        if result.data and len(result.data) > 0:
            return SensorReading(**result.data[0])
        else:
            raise Exception("Failed to store sensor data")

    async def get_latest_reading(self, device_id: Optional[str] = None) -> Optional[SensorReading]:
        """
        Get the latest sensor reading

        Args:
            device_id: Optional device ID filter

        Returns:
            The latest sensor reading or None
        """
        query = self.supabase.table(self.table_name).select("*").order("created_at", desc=True).limit(1)

        if device_id:
            query = query.eq("device_id", device_id)

        result = query.execute()

        if result.data and len(result.data) > 0:
            return SensorReading(**result.data[0])
        return None

    async def get_historical_data(
        self,
        duration: str = "24h",
        device_id: Optional[str] = None
    ) -> List[SensorReading]:
        """
        Get historical sensor data for a given duration

        Args:
            duration: Time duration (1h, 24h, 7d, 30d)
            device_id: Optional device ID filter

        Returns:
            List of sensor readings
        """
        # Parse duration
        duration_map = {
            "1h": timedelta(hours=1),
            "24h": timedelta(hours=24),
            "7d": timedelta(days=7),
            "30d": timedelta(days=30),
        }

        time_delta = duration_map.get(duration, timedelta(hours=24))
        start_time = datetime.utcnow() - time_delta

        # Query Supabase
        query = (
            self.supabase.table(self.table_name)
            .select("*")
            .gte("created_at", start_time.isoformat())
            .order("created_at", desc=False)
        )

        if device_id:
            query = query.eq("device_id", device_id)

        result = query.execute()

        return [SensorReading(**item) for item in result.data]

    async def get_system_status(self, device_id: Optional[str] = None) -> dict:
        """
        Get current system status

        Args:
            device_id: Optional device ID filter

        Returns:
            System status dictionary
        """
        latest = await self.get_latest_reading(device_id)

        if not latest:
            return {
                "status": "offline",
                "last_seen": None,
                "message": "No data received from device"
            }

        # Check if data is recent (within last 10 minutes)
        time_diff = datetime.utcnow() - latest.created_at
        is_online = time_diff.total_seconds() < 600  # 10 minutes

        # Check for warnings
        warnings = []
        if latest.battery_voltage and latest.battery_voltage < 11.5:
            warnings.append("Low battery voltage")
        if latest.tds_ppm and latest.tds_ppm > 500:
            warnings.append("High TDS - water quality issue")

        return {
            "status": "online" if is_online else "offline",
            "last_seen": latest.created_at,
            "system_state": latest.system_state,
            "battery_voltage": latest.battery_voltage,
            "warnings": warnings,
            "device_id": latest.device_id
        }

    async def get_statistics(
        self,
        duration: str = "24h",
        device_id: Optional[str] = None
    ) -> dict:
        """
        Get statistical summary of sensor data

        Args:
            duration: Time duration for stats
            device_id: Optional device ID filter

        Returns:
            Statistics dictionary
        """
        data = await self.get_historical_data(duration, device_id)

        if not data:
            return {
                "count": 0,
                "duration": duration,
                "message": "No data available for this period"
            }

        # Calculate statistics
        temps_basin = [r.basin_temp for r in data if r.basin_temp is not None]
        temps_condenser = [r.condenser_temp for r in data if r.condenser_temp is not None]
        tds_values = [r.tds_ppm for r in data if r.tds_ppm is not None]
        battery_values = [r.battery_voltage for r in data if r.battery_voltage is not None]

        return {
            "count": len(data),
            "duration": duration,
            "basin_temp": {
                "avg": round(sum(temps_basin) / len(temps_basin), 2) if temps_basin else None,
                "min": min(temps_basin) if temps_basin else None,
                "max": max(temps_basin) if temps_basin else None,
            },
            "condenser_temp": {
                "avg": round(sum(temps_condenser) / len(temps_condenser), 2) if temps_condenser else None,
                "min": min(temps_condenser) if temps_condenser else None,
                "max": max(temps_condenser) if temps_condenser else None,
            },
            "tds_ppm": {
                "avg": round(sum(tds_values) / len(tds_values), 2) if tds_values else None,
                "min": min(tds_values) if tds_values else None,
                "max": max(tds_values) if tds_values else None,
            },
            "battery_voltage": {
                "avg": round(sum(battery_values) / len(battery_values), 2) if battery_values else None,
                "min": min(battery_values) if battery_values else None,
                "max": max(battery_values) if battery_values else None,
            }
        }
