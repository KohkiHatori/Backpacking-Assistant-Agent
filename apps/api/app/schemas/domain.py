from __future__ import annotations
from datetime import date, datetime, time
from typing import List, Optional, Tuple
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, HttpUrl

# --- Users ---

class UserBase(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    image: Optional[HttpUrl] = None
    citizenship: Optional[str] = None
    currency: Optional[str] = "USD"
    food_dietary: Optional[str] = None
    onboarding_completed: bool = False

class User(UserBase):
    id: UUID
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# --- Trips ---

class TripBase(BaseModel):
    name: str = Field(..., min_length=1)
    description: Optional[str] = None

    start_point: Optional[str] = None
    end_point: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    flexible_dates: bool = False

    destinations: List[str] = []
    preferences: List[str] = []
    transportation: List[str] = []

    budget: Optional[int] = Field(None, ge=0)
    currency: str = "USD"

class Trip(TripBase):
    id: UUID
    user_id: UUID
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# --- Itinerary Items ---

class ItineraryItemBase(BaseModel):
    day_number: int = Field(..., ge=1)
    order_index: int = 0
    date: Optional[date] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None

    title: str = Field(..., min_length=1)
    description: Optional[str] = None
    location: Optional[str] = None
    geo_coordinates: Optional[Tuple[float, float]] = None # (lat, lng)

    type: Optional[str] = None # 'activity', 'transport', etc.
    cost: Optional[int] = Field(None, ge=0)

class ItineraryItem(ItineraryItemBase):
    id: UUID
    trip_id: UUID
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# --- Tasks ---

class TaskBase(BaseModel):
    title: str = Field(..., min_length=1)
    description: Optional[str] = None
    is_completed: bool = False

    due_date: Optional[datetime] = None
    category: Optional[str] = None
    priority: str = "medium"

class Task(TaskBase):
    id: UUID
    trip_id: UUID
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
