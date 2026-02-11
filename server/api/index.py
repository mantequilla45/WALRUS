"""
Vercel Serverless Function Handler
Entry point for Vercel deployment
"""

import sys
import os

# Ensure the server root is in the Python path so that
# imports like 'from config.supabase import ...' work correctly
server_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if server_root not in sys.path:
    sys.path.insert(0, server_root)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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
origins = os.getenv("ALLOWED_ORIGINS", "*").split(",")

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


@app.get("/api")
async def api_root():
    """API root"""
    return {
        "message": "WALRUS API",
        "endpoints": {
            "esp32": "/api/esp32/data",
            "mobile_latest": "/api/mobile/latest",
            "mobile_history": "/api/mobile/history",
            "mobile_status": "/api/mobile/status",
            "mobile_stats": "/api/mobile/stats"
        }
    }
