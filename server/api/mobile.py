"""
Mobile API Routes
Endpoints for the mobile app to fetch data and status
"""

from fastapi import APIRouter, Query, HTTPException, status
from typing import Optional
from models.sensor_reading import SensorReadingResponse, HistoricalDataResponse
from services.data_service import DataService

router = APIRouter()
data_service = DataService()


@router.get("/latest", response_model=SensorReadingResponse)
async def get_latest_reading(device_id: Optional[str] = Query(None)):
    """
    Get the latest sensor reading

    **Query Parameters**:
    - `device_id` (optional): Filter by specific device ID

    **Response**:
    ```json
    {
        "success": true,
        "data": {
            "id": 123,
            "created_at": "2025-02-11T12:00:00Z",
            "device_id": "WALRUS_001",
            "basin_temp": 52.3,
            "condenser_temp": 28.5,
            "tds_ppm": 245,
            "water_level_cm": 15.2,
            "battery_voltage": 12.4,
            "solar_current": 1.8,
            "system_state": "Distilling",
            "pump_active": false,
            "fan_active": true
        }
    }
    ```
    """
    try:
        latest = await data_service.get_latest_reading(device_id)

        if not latest:
            return SensorReadingResponse(
                success=False,
                message="No data available"
            )

        return SensorReadingResponse(
            success=True,
            data=latest,
            message="Latest reading retrieved successfully"
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch latest reading: {str(e)}"
        )


@router.get("/history", response_model=HistoricalDataResponse)
async def get_historical_data(
    duration: str = Query("24h", regex="^(1h|24h|7d|30d)$"),
    device_id: Optional[str] = Query(None)
):
    """
    Get historical sensor data

    **Query Parameters**:
    - `duration`: Time range (1h, 24h, 7d, 30d) - default: 24h
    - `device_id` (optional): Filter by specific device ID

    **Response**:
    ```json
    {
        "success": true,
        "data": [ ...array of readings... ],
        "count": 48,
        "duration": "24h"
    }
    ```
    """
    try:
        data = await data_service.get_historical_data(duration, device_id)

        return HistoricalDataResponse(
            success=True,
            data=data,
            count=len(data),
            duration=duration
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch historical data: {str(e)}"
        )


@router.get("/status")
async def get_system_status(device_id: Optional[str] = Query(None)):
    """
    Get current system status and health

    **Query Parameters**:
    - `device_id` (optional): Filter by specific device ID

    **Response**:
    ```json
    {
        "status": "online",
        "last_seen": "2025-02-11T12:00:00Z",
        "system_state": "Distilling",
        "battery_voltage": 12.4,
        "warnings": [],
        "device_id": "WALRUS_001"
    }
    ```
    """
    try:
        status_data = await data_service.get_system_status(device_id)
        return status_data

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch system status: {str(e)}"
        )


@router.get("/stats")
async def get_statistics(
    duration: str = Query("24h", regex="^(1h|24h|7d|30d)$"),
    device_id: Optional[str] = Query(None)
):
    """
    Get statistical summary of sensor data

    **Query Parameters**:
    - `duration`: Time range (1h, 24h, 7d, 30d) - default: 24h
    - `device_id` (optional): Filter by specific device ID

    **Response**:
    ```json
    {
        "count": 48,
        "duration": "24h",
        "basin_temp": {
            "avg": 51.5,
            "min": 48.2,
            "max": 55.3
        },
        "tds_ppm": {
            "avg": 250,
            "min": 230,
            "max": 280
        },
        ...
    }
    ```
    """
    try:
        stats = await data_service.get_statistics(duration, device_id)
        return stats

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch statistics: {str(e)}"
        )
