"""
Simulation Service
Generates realistic fake sensor data and inserts it into Supabase.
This is a development tool — will be replaced by real ESP32 data in production.
"""

import asyncio
import random
import math
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
        self._tds_ppm = 250
        self._clean_level = 5.0          # cm of clean water collected
        self._state = "Monitoring"
        self._intake_pump = False
        self._collect_pump = False
        self._mist = False
        self._float_water_detect = True

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

        # Day cycle (basin heats up during "day", cools at "night")
        day_factor = (math.sin(t * 0.05) + 1) / 2  # 0..1

        # Basin temp drifts 35-60 °C following day cycle; mist active accelerates evaporation
        target_basin = 38 + day_factor * 18
        self._basin_temp += (target_basin - self._basin_temp) * 0.15 + random.uniform(-0.3, 0.3)
        self._basin_temp = max(28.0, min(65.0, self._basin_temp))

        # TDS drifts slowly
        self._tds_ppm += random.randint(-3, 3)
        self._tds_ppm = max(0, min(400, self._tds_ppm))

        # Clean water level: rises while distilling (mist on), drops when collect pump runs
        if self._mist:
            self._clean_level += random.uniform(0.02, 0.08)
        if self._collect_pump:
            self._clean_level -= random.uniform(0.4, 0.8)
        self._clean_level = max(0.0, min(50.0, self._clean_level))

        # Simple state machine
        if self._clean_level >= 40.0:
            self._state = "Collecting"
            self._collect_pump = True
            self._mist = False
        elif self._clean_level <= 2.0:
            self._state = "Refilling"
            self._intake_pump = True
            self._collect_pump = False
            self._mist = False
        elif self._basin_temp > 45 and not self._collect_pump:
            self._state = "Distilling"
            self._mist = True
            self._intake_pump = False
        else:
            self._state = "Monitoring"

        # Stop intake once basin is full enough
        if self._intake_pump and self._basin_temp < 35 and t % 10 == 0:
            self._intake_pump = False

        # Float switch: usually true (water present), occasionally false during refill
        self._float_water_detect = self._state != "Refilling" or random.random() > 0.3

        return {
            "device_id": self.device_id,
            "basin_temp": round(self._basin_temp, 2),
            "tds_ppm": self._tds_ppm,
            "clean_level_cm": round(self._clean_level, 2),
            "intake_pump_active": self._intake_pump,
            "collect_pump_active": self._collect_pump,
            "mist_active": self._mist,
            "float_water_detect": self._float_water_detect,
            "state": self._state,
        }


# Singleton instance
simulation = SimulationService()
