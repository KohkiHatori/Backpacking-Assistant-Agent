"""Business logic for trip-related operations."""

from typing import Dict, Any
from schemas.trip_schemas import TripCreateRequest, TripNameDescriptionResponse
from services.agents.super_agent import get_orchestrator
from services.agents.sub_agents.name_description_agent import get_name_description_agent


class TripService:
    """Service layer for trip operations."""

    def __init__(self):
        """Initialize the trip service."""
        self.orchestrator = get_orchestrator()
        self.name_description_agent = get_name_description_agent()

    async def generate_trip_name_description(
        self,
        trip_request: TripCreateRequest,
        user_id: str | None = None
    ) -> TripNameDescriptionResponse:
        """
        Generate trip name and description using the NameDescriptionAgent directly.

        Args:
            trip_request: Trip creation request with all details
            user_id: Optional user ID for personalization

        Returns:
            TripNameDescriptionResponse with generated name and description

        Raises:
            ValueError: If generation fails
        """
        # Convert Pydantic model to dict
        trip_data = trip_request.model_dump()

        # Convert date objects to strings (if they're not already strings)
        if trip_data.get("start_date") and hasattr(trip_data["start_date"], "isoformat"):
            trip_data["start_date"] = trip_data["start_date"].isoformat()
        if trip_data.get("end_date") and hasattr(trip_data["end_date"], "isoformat"):
            trip_data["end_date"] = trip_data["end_date"].isoformat()

        # Generate name and description directly
        result = self.name_description_agent.generate_name_and_description(trip_data)

        if not result.get("name"):
             raise ValueError("Failed to generate trip information")

        return TripNameDescriptionResponse(
            name=result["name"],
            description=result["description"]
        )

    async def process_full_trip(
        self,
        trip_request: TripCreateRequest,
        user_id: str | None = None
    ) -> Dict[str, Any]:
        """
        Process a trip through all available agents.

        This is the main entry point for comprehensive trip planning that will
        orchestrate all sub-agents (name/description, visa, vaccine, accommodation, etc.)

        Args:
            trip_request: Trip creation request with all details
            user_id: Optional user ID for personalization

        Returns:
            Dictionary with all generated information from sub-agents
        """
        # Convert Pydantic model to dict
        trip_data = trip_request.model_dump()

        # Convert date objects to strings (if they're not already strings)
        if trip_data.get("start_date") and hasattr(trip_data["start_date"], "isoformat"):
            trip_data["start_date"] = trip_data["start_date"].isoformat()
        if trip_data.get("end_date") and hasattr(trip_data["end_date"], "isoformat"):
            trip_data["end_date"] = trip_data["end_date"].isoformat()

        # Process through orchestrator
        result = await self.orchestrator.process_trip(trip_data, user_id)

        return result


# Singleton instance
_service_instance = None


def get_trip_service() -> TripService:
    """Get or create the singleton trip service instance."""
    global _service_instance
    if _service_instance is None:
        _service_instance = TripService()
    return _service_instance
