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
        self._basin_temp = 30.0
        self._tds_ppm = 120
        self._state = "Monitoring"
        self._intake_pump = False
        self._collect_pump = False
        self._peltier = False
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
        """Generate one sensor reading approximating the v12 firmware behavior."""
        t = self._tick

        # Day cycle (basin warms while peltier runs, cools at night)
        day_factor = (math.sin(t * 0.05) + 1) / 2  # 0..1

        # Peltier-style heating: target ~40 °C during ON phase, ~28 °C otherwise
        target_basin = 28 + day_factor * 12 + (8 if self._peltier else 0)
        self._basin_temp += (target_basin - self._basin_temp) * 0.15 + random.uniform(-0.3, 0.3)
        self._basin_temp = max(22.0, min(45.0, self._basin_temp))

        # TDS drifts slowly around clean-water values
        self._tds_ppm += random.randint(-3, 3)
        self._tds_ppm = max(0, min(300, self._tds_ppm))

        # Simple state machine roughly mirroring the firmware
        if self._basin_temp < 30 and day_factor > 0.4:
            # Day, basin cool → heater fires up
            self._peltier = True
            self._collect_pump = False
            self._state = "Heating"
        elif self._basin_temp >= 40:
            # Hot enough — stop heating, occasionally collect
            self._peltier = False
            self._collect_pump = (t % 30 == 0)
            self._state = "Collecting" if self._collect_pump else "Monitoring"
        else:
            self._peltier = False
            self._collect_pump = False
            self._state = "Monitoring"

        # Float dry occasionally during op → intake fires
        if random.random() < 0.03:
            self._intake_pump = True
            self._float_water_detect = False
            self._state = "Refilling"
        elif self._intake_pump and random.random() < 0.3:
            self._intake_pump = False
            self._float_water_detect = True

        return {
            "device_id": self.device_id,
            "basin_temp": round(self._basin_temp, 2),
            "tds_ppm": self._tds_ppm,
            "intake_pump_active": self._intake_pump,
            "collect_pump_active": self._collect_pump,
            "peltier_active": self._peltier,
            "float_water_detect": self._float_water_detect,
            "state": self._state,
        }


# Singleton instance
simulation = SimulationService()
