"""API routes for AI agent operations."""

from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any
from schemas.trip_schemas import (
    TripCreateRequest,
    TripNameDescriptionResponse
)
from services.trip_service import get_trip_service, TripService

router = APIRouter(prefix="/agents", tags=["agents"])


@router.post("/generate-trip-name", response_model=TripNameDescriptionResponse)
async def generate_trip_name_and_description(
    trip_request: TripCreateRequest,
    trip_service: TripService = Depends(get_trip_service)
) -> TripNameDescriptionResponse:
    """
    Generate a creative trip name and description based on trip details.

    This endpoint uses the AI agent orchestrator to generate engaging content
    for a trip based on destinations, dates, preferences, and other details.

    Args:
        trip_request: Trip details for generation
        trip_service: Injected trip service

    Returns:
        Generated trip name and description
    """
    try:
        result = await trip_service.generate_trip_name_description(trip_request)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/process-trip", response_model=Dict[str, Any])
async def process_full_trip(
    trip_request: TripCreateRequest,
    trip_service: TripService = Depends(get_trip_service)
) -> Dict[str, Any]:
    """
    Process a trip through all available AI agents.

    This endpoint orchestrates multiple specialized agents to provide:
    - Trip name and description
    - Visa requirements (future)
    - Vaccine information (future)
    - Accommodation recommendations (future)
    - Restaurant recommendations (future)

    Args:
        trip_request: Trip details for processing
        trip_service: Injected trip service

    Returns:
        Comprehensive trip information from all agents
    """
    try:
        result = await trip_service.process_full_trip(trip_request)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/health")
async def health_check() -> Dict[str, str]:
    """
    Health check endpoint for the agents service.

    Returns:
        Status information
    """
    return {
        "status": "healthy",
        "service": "agents",
        "orchestrator": "langgraph",
        "active_agents": ["name_description"]
    }
