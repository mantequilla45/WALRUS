"""
Simulation Service
Generates realistic fake sensor data and inserts it into Supabase.
This is a development tool — will be replaced by real ESP32 data in production.
"""

import asyncio
import random
import math
from datetime import datetime
from typing import Optional
from config.supabase import get_supabase_admin


class SimulationService:
    """Background simulation that writes fake sensor readings to the database."""

    def __init__(self):
        self.supabase = get_supabase_admin()
        self.table_name = "sensor_readings"
        self._task: Optional[asyncio.Task] = None
        self._running = False
        self.interval_seconds = 1
        self.device_id = "WALRUS_SIM"

        # Internal state for smooth transitions
        self._tick = 0
        self._basin_temp = 50.0
        self._condenser_temp = 30.0
        self._tds_ppm = 250
        self._water_level = 15.0
        self._battery_voltage = 12.6
        self._solar_current = 1.5
        self._system_state = "Distilling"
        self._pump_active = False
        self._fan_active = True

    @property
    def is_running(self) -> bool:
        return self._running

    def start(self):
        """Start the simulation loop."""
        if self._running:
            return
        self._running = True
        self._task = asyncio.create_task(self._run_loop())

    def stop(self):
        """Stop the simulation loop."""
        self._running = False
        if self._task:
            self._task.cancel()
            self._task = None

    def set_interval(self, seconds: int):
        """Update the simulation interval."""
        self.interval_seconds = max(1, min(seconds, 300))

    def get_status(self) -> dict:
        """Return current simulation status."""
        return {
            "running": self._running,
            "interval_seconds": self.interval_seconds,
            "device_id": self.device_id,
            "tick": self._tick,
        }

    async def _run_loop(self):
        """Main simulation loop."""
        while self._running:
            try:
                reading = self._generate_reading()
                self.supabase.table(self.table_name).insert(reading).execute()
                self._tick += 1
            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"[Simulation] Error inserting reading: {e}")
            await asyncio.sleep(self.interval_seconds)

    def _generate_reading(self) -> dict:
        """Generate a single realistic sensor reading with smooth drift."""
        t = self._tick

        # Simulate a day cycle (basin heats up during "day", cools at "night")
        day_factor = (math.sin(t * 0.05) + 1) / 2  # 0..1 sinusoidal

        # Basin temp: drifts 40-60°C following day cycle
        target_basin = 42 + day_factor * 16
        self._basin_temp += (target_basin - self._basin_temp) * 0.15 + random.uniform(-0.3, 0.3)
        self._basin_temp = max(35.0, min(65.0, self._basin_temp))

        # Condenser temp: loosely follows basin but much lower
        target_condenser = 24 + day_factor * 6
        self._condenser_temp += (target_condenser - self._condenser_temp) * 0.1 + random.uniform(-0.2, 0.2)
        self._condenser_temp = max(20.0, min(45.0, self._condenser_temp))

        # TDS: generally stable with occasional drift
        self._tds_ppm += random.randint(-5, 5)
        self._tds_ppm = max(100, min(600, self._tds_ppm))

        # Water level: slowly drops when distilling, refills periodically
        if self._system_state == "Distilling":
            self._water_level -= random.uniform(0.05, 0.15)
        elif self._system_state == "Refilling":
            self._water_level += random.uniform(0.3, 0.6)

        if self._water_level < 5.0:
            self._system_state = "Refilling"
            self._pump_active = True
        elif self._water_level > 20.0:
            self._system_state = "Distilling"
            self._pump_active = False
        self._water_level = max(2.0, min(25.0, self._water_level))

        # Battery: discharges slowly, solar charges during "day"
        solar_output = day_factor * 2.5 + random.uniform(-0.1, 0.1)
        self._solar_current = max(0.0, min(4.5, solar_output))

        charge_rate = (self._solar_current - 0.8) * 0.01  # net charge/discharge
        self._battery_voltage += charge_rate + random.uniform(-0.02, 0.02)
        self._battery_voltage = max(10.8, min(13.8, self._battery_voltage))

        # Fan: active when basin is hot
        self._fan_active = self._basin_temp > 48

        # Occasional state changes
        if random.random() < 0.02:
            self._system_state = random.choice(["Idle", "Distilling", "Sleep"])

        return {
            "device_id": self.device_id,
            "basin_temp": round(self._basin_temp, 2),
            "condenser_temp": round(self._condenser_temp, 2),
            "tds_ppm": self._tds_ppm,
            "water_level_cm": round(self._water_level, 2),
            "battery_voltage": round(self._battery_voltage, 2),
            "solar_current": round(self._solar_current, 2),
            "system_state": self._system_state,
            "pump_active": self._pump_active,
            "fan_active": self._fan_active,
        }


# Singleton instance
simulation = SimulationService()
