"""
Simulation API Routes
Endpoints to control the fake data simulation (dev only)
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from services.simulation_service import simulation

router = APIRouter()


class SimulationConfig(BaseModel):
    interval_seconds: int = Field(5, ge=1, le=300, description="Seconds between readings")


@router.post("/start")
async def start_simulation():
    """Start the simulation. It will insert fake readings at the configured interval."""
    if simulation.is_running:
        return {"message": "Simulation is already running", **simulation.get_status()}
    simulation.start()
    return {"message": "Simulation started", **simulation.get_status()}


@router.post("/stop")
async def stop_simulation():
    """Stop the simulation."""
    if not simulation.is_running:
        return {"message": "Simulation is not running", **simulation.get_status()}
    simulation.stop()
    return {"message": "Simulation stopped", **simulation.get_status()}


@router.get("/status")
async def simulation_status():
    """Get current simulation status."""
    return simulation.get_status()


@router.patch("/config")
async def update_simulation_config(config: SimulationConfig):
    """Update the simulation interval (in seconds)."""
    simulation.set_interval(config.interval_seconds)
    return {"message": "Configuration updated", **simulation.get_status()}
