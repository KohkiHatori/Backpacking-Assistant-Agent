"""API routes for accommodation recommendations."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
from services.agents.sub_agents.accommodation_agent import get_accommodation_agent
from supabase import create_client, Client
import os

router = APIRouter(prefix="/accommodations", tags=["accommodations"])


def get_supabase() -> Client:
    """Get Supabase client."""
    return create_client(
        os.getenv("SUPABASE_URL"),
        os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    )


class AccommodationRequest(BaseModel):
    """Request schema for accommodation recommendations."""
    destination: str
    trip_id: str
    nights_count: int
    range_type: str = "all"  # "all", "budget", "mid-range", "luxury"


class AccommodationResponse(BaseModel):
    """Response schema for accommodation recommendations."""
    recommendations: List[Dict[str, Any]]
    destination: str
    nights_count: int


@router.post("/recommend", response_model=AccommodationResponse)
async def recommend_accommodations(request: AccommodationRequest):
    """
    Get accommodation recommendations for a specific destination.

    This endpoint uses Perplexity AI to research and recommend
    3 accommodation options (budget/mid-range/luxury by default).

    Args:
        request: Accommodation request with destination, trip_id, nights, and range type

    Returns:
        List of 3 accommodation recommendations with details
    """
    try:
        print(f"[ACCOMMODATION API] Received request for {request.destination}")
        print(f"[ACCOMMODATION API] Trip: {request.trip_id}, Nights: {request.nights_count}, Range: {request.range_type}")

        # Get trip data from database
        supabase = get_supabase()
        trip_response = supabase.table("trips").select("*").eq("id", request.trip_id).single().execute()

        if not trip_response.data:
            raise HTTPException(status_code=404, detail=f"Trip {request.trip_id} not found")

        trip_data = trip_response.data
        print(f"[ACCOMMODATION API] Fetched trip data for: {trip_data.get('name')}")

        # Call accommodation agent
        agent = get_accommodation_agent()
        recommendations = agent.recommend_accommodations(
            destination=request.destination,
            trip_data=trip_data,
            nights_count=request.nights_count,
            range_type=request.range_type
        )

        print(f"[ACCOMMODATION API] Generated {len(recommendations)} recommendations")

        return AccommodationResponse(
            recommendations=recommendations,
            destination=request.destination,
            nights_count=request.nights_count
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"[ACCOMMODATION API] ERROR: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate accommodation recommendations: {str(e)}"
        )
