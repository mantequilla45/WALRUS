"""
ESP32 API Routes
Endpoints for receiving data from ESP32 devices
"""

from fastapi import APIRouter, Depends, HTTPException, status
from models.sensor_reading import ESP32DataPayload, SensorReadingResponse
from services.data_service import DataService
from middleware.auth import verify_esp32_api_key

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
            "condenser_temp": 28.5,
            "tds_ppm": 245,
            "water_level_cm": 15.2,
            "battery_voltage": 12.4,
            "solar_current": 1.8
        },
        "actuators": {
            "pump_active": false,
            "fan_active": true
        },
        "state": "Distilling"
    }
    ```

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
        # Store data in database
        stored_reading = await data_service.store_sensor_data(payload)

        return SensorReadingResponse(
            success=True,
            data=stored_reading,
            message="Data stored successfully"
        )

    except Exception as e:
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
