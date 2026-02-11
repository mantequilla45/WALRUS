"""
Supabase Configuration
Initialize Supabase client for database operations
"""

import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in environment variables")

# Create Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Create service role client (for admin operations)
supabase_admin: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY or SUPABASE_KEY)


def get_supabase_client() -> Client:
    """Get Supabase client instance"""
    return supabase


def get_supabase_admin() -> Client:
    """Get Supabase admin client instance"""
    return supabase_admin
