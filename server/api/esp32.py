"""
ESP32 API Routes
Endpoints for receiving data from ESP32 devices
"""

import logging
from fastapi import APIRouter, Depends, HTTPException, status
from models.sensor_reading import ESP32CommandsResponse, ESP32DataPayload
from services.data_service import DataService
from middleware.auth import verify_esp32_api_key

logger = logging.getLogger("uvicorn.error")

router = APIRouter()
data_service = DataService()


@router.post("/data", response_model=ESP32CommandsResponse, status_code=status.HTTP_201_CREATED)
async def receive_sensor_data(
    payload: ESP32DataPayload,
    api_key: str = Depends(verify_esp32_api_key)
):
    """
    Receive and store sensor data from ESP32, then return current command overrides.

    **Authentication**: Requires X-API-Key header

    **Request Body**:
    ```json
    {
        "device_id": "WALRUS_001",
        "sensors": {
            "basin_temp": 36.5,
            "tds_ppm": 120,
            "float_water_detect": true
        },
        "actuators": {
            "intake_pump_active": false,
            "collect_pump_active": false,
            "peltier_active": true
        },
        "state": "Heating"
    }
    ```

    **Response** (per INTEGRATION.md):
    ```json
    {
        "sleep": false,
        "commands": {
            "intake_pump_override":  "auto",
            "collect_pump_override": "auto",
            "peltier_override":      "auto"
        }
    }
    ```
    """
    try:
        logger.info(
            f"[ESP32] Data from {payload.device_id} | "
            f"basin={payload.sensors.basin_temp}°C "
            f"tds={payload.sensors.tds_ppm}ppm "
            f"clean_level={payload.sensors.clean_level_cm}cm "
            f"float={payload.sensors.float_water_detect} "
            f"state={payload.state}"
        )

        # Store the reading
        stored = await data_service.store_sensor_data(payload)

        # Read current overrides for this device
        commands = await data_service.get_device_commands(payload.device_id)

        logger.info(
            f"[ESP32] Stored id={stored.id} "
            f"| sleep={commands.sleep} "
            f"intake={commands.commands.intake_pump_override} "
            f"collect={commands.commands.collect_pump_override} "
            f"peltier={commands.commands.peltier_override}"
        )

        return commands

    except Exception as e:
        logger.error(f"[ESP32] Failed to store data: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to store sensor data: {str(e)}",
        )


@router.get("/test")
async def test_endpoint(api_key: str = Depends(verify_esp32_api_key)):
    """Health check for ESP32 connectivity. Requires X-API-Key header."""
    return {"success": True, "message": "ESP32 connection successful"}
