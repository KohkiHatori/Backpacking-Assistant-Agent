"""FastAPI application entry point."""

import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from routers import agents, itinerary, tasks, accommodations
from dependencies.config import get_settings

# Load environment variables
load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for startup and shutdown events.

    This is where you can initialize resources (database connections,
    cache clients, etc.) on startup and clean them up on shutdown.
    """
    # Startup
    print("🚀 Starting Backpacking Assistant API...")
    print(f"Environment: {os.getenv('ENVIRONMENT', 'development')}")

    # Validate critical environment variables
    settings = get_settings()
    if not settings.gemini_api_key:
        raise ValueError("GEMINI_API_KEY not set in environment")
    if not settings.supabase_url:
        raise ValueError("SUPABASE_URL not set in environment")

    print("✅ Configuration validated")
    print("✅ Agent orchestrator ready")

    yield

    # Shutdown
    print("👋 Shutting down Backpacking Assistant API...")


# Create FastAPI application
app = FastAPI(
    title="Backpacking Assistant API",
    description="AI-powered trip planning with LangGraph agent orchestration",
    version="0.1.0",
    lifespan=lifespan
)

# Configure CORS
# Get allowed origins from environment or use defaults
allowed_origins = os.getenv("ALLOWED_ORIGINS", "").split(",") if os.getenv("ALLOWED_ORIGINS") else [
    "http://localhost:3000",  # Next.js dev server
    "http://localhost:3001",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(agents.router)
app.include_router(itinerary.router)
app.include_router(tasks.router)
app.include_router(accommodations.router)


@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "name": "Backpacking Assistant API",
        "version": "0.1.0",
        "status": "running",
        "orchestrator": "LangGraph 1.0.0",
        "model": "Gemini 2.5 Flash",
        "endpoints": {
            "agents": "/agents",
            "docs": "/docs",
            "openapi": "/openapi.json"
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "backpacking-assistant-api",
        "environment": os.getenv("ENVIRONMENT", "development")
    }


if __name__ == "__main__":
    import uvicorn

    settings = get_settings()
    # Use PORT from environment (for Railway/cloud deployments) or default to settings
    port = int(os.getenv("PORT", settings.api_port))
    # Disable reload in production
    reload = settings.api_reload if os.getenv("ENVIRONMENT") == "development" else False

    uvicorn.run(
        "main:app",
        host=settings.api_host,
        port=port,
        reload=reload
    )
