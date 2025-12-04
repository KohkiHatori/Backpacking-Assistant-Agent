"""Pydantic schemas for trip-related data validation."""

from pydantic import BaseModel, Field
from typing import Optional, List, Union
from datetime import date


class TripCreateRequest(BaseModel):
    """Request schema for creating a trip with all necessary information."""

    destinations: List[str] = Field(..., description="List of destinations")
    start_point: Optional[str] = Field(None, description="Starting location")
    end_point: Optional[str] = Field(None, description="Ending location")
    start_date: Optional[Union[date, str]] = Field(None, description="Trip start date (YYYY-MM-DD)")
    end_date: Optional[Union[date, str]] = Field(None, description="Trip end date (YYYY-MM-DD)")
    flexible_dates: bool = Field(default=False, description="Whether dates are flexible")
    adults_count: int = Field(..., ge=1, description="Number of adults")
    children_count: int = Field(default=0, ge=0, description="Number of children")
    preferences: List[str] = Field(default_factory=list, description="Trip preferences")
    transportation: List[str] = Field(default_factory=list, description="Transportation modes")
    budget: int = Field(..., ge=0, description="Budget amount")
    currency: str = Field(..., description="Currency code (e.g., USD, EUR)")

    class Config:
        json_schema_extra = {
            "example": {
                "destinations": ["Tokyo", "Kyoto"],
                "start_point": "San Francisco",
                "end_point": "Osaka",
                "start_date": "2024-06-01",
                "end_date": "2024-06-15",
                "flexible_dates": False,
                "adults_count": 2,
                "children_count": 0,
                "preferences": ["culture", "food", "hiking"],
                "transportation": ["train", "walking"],
                "budget": 3000,
                "currency": "USD"
            }
        }


class TripNameDescriptionResponse(BaseModel):
    """Response schema for generated trip name and description."""

    name: str = Field(..., description="Generated trip name")
    description: str = Field(..., description="Generated trip description")

    class Config:
        json_schema_extra = {
            "example": {
                "name": "Tokyo to Osaka: A Cultural Adventure",
                "description": "Experience the best of Japanese culture, cuisine, and nature across two iconic cities."
            }
        }


class AgentState(BaseModel):
    """State model for LangGraph agent orchestration."""

    trip_data: TripCreateRequest
    name: Optional[str] = None
    description: Optional[str] = None
    error: Optional[str] = None
    user_id: Optional[str] = None

    class Config:
        arbitrary_types_allowed = True
