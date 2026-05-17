"""
Data Service
Business logic for storing and retrieving sensor data
"""

from datetime import datetime, timedelta
from typing import List, Optional
from config.supabase import get_supabase_admin
from models.sensor_reading import (
    DeviceCommandOverrides,
    DeviceConfig,
    ESP32CommandsResponse,
    ESP32DataPayload,
    SensorReading,
)


class DataService:
    """Service for handling sensor data operations"""

    def __init__(self):
        self.supabase = get_supabase_admin()
        self.table_name = "sensor_readings"
        self.device_commands_table = "device_commands"

    async def get_device_commands(self, device_id: str) -> ESP32CommandsResponse:
        """Read current commands + config for a device. Falls back to defaults if absent."""
        result = (
            self.supabase.table(self.device_commands_table)
            .select(
                "sleep,"
                "intake_pump_override, collect_pump_override, peltier_override,"
                "wake_minute, sleep_minute,"
                "peltier_start_minute, peltier_stop_minute,"
                "peltier_on_minutes, peltier_cycle_minutes,"
                "collect_cycle_minutes, collect_duration_seconds,"
                "sync_interval_ms"
            )
            .eq("device_id", device_id)
            .limit(1)
            .execute()
        )
        if not result.data:
            return ESP32CommandsResponse()

        row = result.data[0]
        default_config = DeviceConfig()
        return ESP32CommandsResponse(
            sleep=bool(row.get("sleep")),
            commands=DeviceCommandOverrides(
                intake_pump_override=row.get("intake_pump_override") or "auto",
                collect_pump_override=row.get("collect_pump_override") or "auto",
                peltier_override=row.get("peltier_override") or "auto",
            ),
            config=DeviceConfig(
                wake_minute=row.get("wake_minute") or default_config.wake_minute,
                sleep_minute=row.get("sleep_minute") or default_config.sleep_minute,
                peltier_start_minute=row.get("peltier_start_minute") or default_config.peltier_start_minute,
                peltier_stop_minute=row.get("peltier_stop_minute") or default_config.peltier_stop_minute,
                peltier_on_minutes=row.get("peltier_on_minutes") or default_config.peltier_on_minutes,
                peltier_cycle_minutes=row.get("peltier_cycle_minutes") or default_config.peltier_cycle_minutes,
                collect_cycle_minutes=row.get("collect_cycle_minutes") or default_config.collect_cycle_minutes,
                collect_duration_seconds=row.get("collect_duration_seconds") or default_config.collect_duration_seconds,
                sync_interval_ms=row.get("sync_interval_ms") or default_config.sync_interval_ms,
            ),
        )

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
            "tds_ppm": payload.sensors.tds_ppm,
            "clean_level_cm": payload.sensors.clean_level_cm,
            "float_water_detect": payload.sensors.float_water_detect,
            "state": payload.state,
        }

        # Add actuator data if present
        if payload.actuators:
            data["intake_pump_active"] = payload.actuators.intake_pump_active
            data["collect_pump_active"] = payload.actuators.collect_pump_active
            data["peltier_active"] = payload.actuators.peltier_active

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
        if latest.tds_ppm is not None and latest.tds_ppm > 500:
            warnings.append("High TDS - water quality issue")
        if latest.clean_level_cm is not None and latest.clean_level_cm < 5.0:
            warnings.append("Clean water level low")
        if latest.float_water_detect is False:
            warnings.append("Float switch reports no water")

        return {
            "status": "online" if is_online else "offline",
            "last_seen": latest.created_at,
            "state": latest.state,
            "warnings": warnings,
            "device_id": latest.device_id,
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
        tds_values = [r.tds_ppm for r in data if r.tds_ppm is not None]
        clean_levels = [r.clean_level_cm for r in data if r.clean_level_cm is not None]

        def stats(values):
            return {
                "avg": round(sum(values) / len(values), 2) if values else None,
                "min": min(values) if values else None,
                "max": max(values) if values else None,
            }

        return {
            "count": len(data),
            "duration": duration,
            "basin_temp": stats(temps_basin),
            "tds_ppm": stats(tds_values),
            "clean_level_cm": stats(clean_levels),
        }
