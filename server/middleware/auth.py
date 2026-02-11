"""
Authentication Middleware
Verify ESP32 API keys and user tokens
"""

import os
from fastapi import Header, HTTPException, status
from typing import Optional


def verify_esp32_api_key(x_api_key: Optional[str] = Header(None)) -> str:
    """
    Verify ESP32 API key from request headers

    Args:
        x_api_key: API key from X-API-Key header

    Returns:
        The verified API key

    Raises:
        HTTPException: If API key is missing or invalid
    """
    expected_key = os.getenv("ESP32_API_KEY")

    if not x_api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API key is required. Please provide X-API-Key header."
        )

    if x_api_key != expected_key:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid API key"
        )

    return x_api_key


async def verify_user_token(authorization: Optional[str] = Header(None)) -> str:
    """
    Verify user JWT token from Supabase Auth

    Args:
        authorization: Bearer token from Authorization header

    Returns:
        The verified user ID

    Raises:
        HTTPException: If token is missing or invalid
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization token is required"
        )

    # Extract token from "Bearer <token>"
    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise ValueError("Invalid authentication scheme")
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format. Use 'Bearer <token>'"
        )

    # TODO: Verify token with Supabase
    # For now, we'll accept any token (implement Supabase verification later)

    return token
