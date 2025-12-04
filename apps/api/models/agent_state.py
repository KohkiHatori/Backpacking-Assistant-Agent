"""State definitions for LangGraph agents."""

from typing import TypedDict, Optional, List, Annotated
from datetime import date
import operator


class TripData(TypedDict):
    """Trip data structure for agent processing."""
    destinations: List[str]
    start_point: Optional[str]
    end_point: Optional[str]
    start_date: Optional[str]
    end_date: Optional[str]
    flexible_dates: bool
    adults_count: int
    children_count: int
    preferences: List[str]
    transportation: List[str]
    budget: int
    currency: str


class SuperAgentState(TypedDict):
    """State for the super-agent orchestrator."""

    # Input data
    trip_data: TripData
    user_id: Optional[str]

    # Generated outputs from sub-agents
    trip_name: Optional[str]
    trip_description: Optional[str]

    # Future sub-agent outputs (placeholders for now)
    visa_info: Optional[dict]
    vaccine_info: Optional[dict]
    accommodation_recommendations: Optional[List[dict]]
    restaurant_recommendations: Optional[List[dict]]

    # Orchestration metadata
    completed_agents: Annotated[List[str], operator.add]
    errors: Annotated[List[str], operator.add]

    # Final status
    status: str  # 'pending', 'processing', 'completed', 'failed'
