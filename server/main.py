"""
WALRUS Backend Server - Local Development
FastAPI application for local testing and development
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
import os

# Load environment variables (.env.local takes priority, falls back to .env)
load_dotenv(".env.local")
load_dotenv()

# Import routers
from api.esp32 import router as esp32_router
from api.mobile import router as mobile_router
from api.simulation import router as simulation_router

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
app.include_router(simulation_router, prefix="/api/simulation", tags=["Simulation"])


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
    }


@app.get("/simulation")
async def simulation_page():
    """Serve the simulation control panel UI."""
    return FileResponse(
        os.path.join(os.path.dirname(__file__), "static", "simulation.html"),
        media_type="text/html"
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
