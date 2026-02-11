"""
WALRUS Backend Server - Local Development
FastAPI application for local testing and development
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Import routers
from api.esp32 import router as esp32_router
from api.mobile import router as mobile_router

# Create FastAPI app
app = FastAPI(
    title="WALRUS API",
    description="Backend API for WALRUS Water Purification System",
    version="1.0.0",
)

# CORS configuration
origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:8081").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(esp32_router, prefix="/api/esp32", tags=["ESP32"])
app.include_router(mobile_router, prefix="/api/mobile", tags=["Mobile"])


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "online",
        "service": "WALRUS Backend API",
        "version": "1.0.0"
    }


@app.get("/health")
async def health():
    """Detailed health check"""
    return {
        "status": "healthy",
        "database": "connected",  # TODO: Add actual DB health check
        "timestamp": "2025-02-11T12:00:00Z"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
