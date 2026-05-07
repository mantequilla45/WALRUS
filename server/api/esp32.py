"""
ESP32 API Routes
Endpoints for receiving data from ESP32 devices
"""

import logging
from fastapi import APIRouter, Depends, HTTPException, status
from models.sensor_reading import ESP32DataPayload, SensorReadingResponse
from services.data_service import DataService
from middleware.auth import verify_esp32_api_key

logger = logging.getLogger("uvicorn.error")

router = APIRouter()
data_service = DataService()


@router.post("/data", response_model=SensorReadingResponse)
async def receive_sensor_data(
    payload: ESP32DataPayload,
    api_key: str = Depends(verify_esp32_api_key)
):
    """
    Receive and store sensor data from ESP32

    **Authentication**: Requires X-API-Key header

    **Request Body**:
    ```json
    {
        "device_id": "WALRUS_001",
        "sensors": {
            "basin_temp": 52.3,
            "tds_ppm": 245,
            "clean_level_cm": 15.2,
            "float_water_detect": true
        },
        "actuators": {
            "intake_pump_active": false,
            "collect_pump_active": false,
            "mist_active": true
        },
        "state": "Distilling"
    }
    ```

    **Response**: includes a `command` field telling the ESP32 the desired state
    when the user has switched to manual mode.

    **Response**:
    ```json
    {
        "success": true,
        "data": { ...stored reading... },
        "message": "Data stored successfully"
    }
    ```
    """
    try:
        logger.info(f"[ESP32] Data from {payload.device_id} | "
                     f"basin={payload.sensors.basin_temp}°C "
                     f"tds={payload.sensors.tds_ppm}ppm "
                     f"clean_level={payload.sensors.clean_level_cm}cm "
                     f"float={payload.sensors.float_water_detect} "
                     f"state={payload.state}")

        # Store data in database
        stored_reading = await data_service.store_sensor_data(payload)

        # Look up desired state for this device (mobile writes to device_state table)
        command = await data_service.get_device_command(payload.device_id)

        logger.info(
            f"[ESP32] Stored reading id={stored_reading.id} "
            f"| cmd mode={command.mode} "
            f"intake={command.desired_intake_pump} "
            f"collect={command.desired_collect_pump} "
            f"mist={command.desired_mist}"
        )

        return SensorReadingResponse(
            success=True,
            data=stored_reading,
            message="Data stored successfully",
            command=command,
        )

    except Exception as e:
        logger.error(f"[ESP32] Failed to store data: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to store sensor data: {str(e)}"
        )


@router.get("/test")
async def test_endpoint(api_key: str = Depends(verify_esp32_api_key)):
    """
    Test endpoint to verify ESP32 can connect

    **Authentication**: Requires X-API-Key header
    """
    return {
        "success": True,
        "message": "ESP32 connection successful",
        "timestamp": "2025-02-11T12:00:00Z"
    }
