from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

from app.api.routers import (
    auth,
    chats,
    messages,
    notifications,
    offers,
    profiles,
    repair_requests,
    mechanics,
    reviews,
    upload
)
from app.utils.supabase_client import supabase

app = FastAPI(title="BikeFix API")
app.state.supabase = supabase

# -----------------------------
# CORS CONFIGURATION
# -----------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://bike-fix-gold.vercel.app",
        "http://localhost:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# -----------------------------
# FIX FOR OPTIONS PREFLIGHT
# -----------------------------
@app.options("/{rest_of_path:path}")
async def preflight_handler(rest_of_path: str):
    return {}

# -----------------------------
# ROUTERS
# -----------------------------
app.include_router(auth.router)
app.include_router(upload.router)
app.include_router(profiles.router)
app.include_router(repair_requests.router)
app.include_router(offers.router)
app.include_router(mechanics.router)
app.include_router(reviews.router)
app.include_router(messages.router)
app.include_router(chats.router)
app.include_router(notifications.router)
