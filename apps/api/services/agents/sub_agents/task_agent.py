from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage
from typing import List, Dict, Any
import os
import json
import re

class TaskAgent:
    """
    Agent responsible for generating tasks for a trip.
    Generates both general tasks (e.g., "Book flights", "Get travel insurance")
    and destination-specific tasks (e.g., "Apply for Japan visa", "Book Osaka accommodation").
    """

    def __init__(self):
        self.model = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            temperature=0.7,
            google_api_key=os.getenv("GEMINI_API_KEY")
        )

    def generate_tasks(self, trip_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Generate a list of tasks for the trip.

        Args:
            trip_data: Dictionary containing trip information:
                - name: Trip name
                - description: Trip description
                - destinations: List of destinations
                - start_point: Starting location
                - end_point: Ending location
                - start_date: Start date
                - end_date: End date
                - adults_count: Number of adults
                - children_count: Number of children
                - preferences: List of preferences
                - transportation: List of transportation modes
                - budget: Budget amount
                - currency: Currency code

        Returns:
            List of task dictionaries, each containing:
                - title: Task title
                - description: Task description (optional)
                - category: Task category (general, visa, accommodation, transportation, etc.)
                - priority: Priority level (high, medium, low)
                - due_date: Suggested due date relative to trip (optional)
                - completed: Boolean (always False for new tasks)
        """
        prompt = self._build_prompt(trip_data)

        try:
            messages = [
                SystemMessage(content=self._get_system_prompt()),
                HumanMessage(content=prompt)
            ]
            response = self.model.invoke(messages)
            tasks = self._parse_task_response(response.content)
            return tasks
        except Exception as e:
            print(f"Error generating tasks: {e}")
            return self._get_fallback_tasks(trip_data)

    def _get_system_prompt(self) -> str:
        """Get the system prompt for task generation."""
        return """You are an expert travel planning assistant specializing in creating comprehensive task lists for trips.

Your job is to generate a complete list of tasks that travelers need to complete before and during their trip.

Task Categories:
1. **General** - Universal tasks for any trip (e.g., "Book flights", "Get travel insurance")
2. **Visa** - Visa and entry requirements for specific destinations
3. **Accommodation** - Booking hotels, hostels, or other lodging
4. **Transportation** - Local transportation bookings (trains, car rentals, etc.)
5. **Health** - Vaccinations, medications, health insurance
6. **Finance** - Currency exchange, notify bank, budget planning
7. **Packing** - What to pack based on destinations and activities
8. **Activities** - Pre-booking activities, tours, or attractions
9. **Documentation** - Passport, copies of documents, emergency contacts

Guidelines:
- Generate 10-20 tasks depending on trip complexity
- Include both general and destination-specific tasks
- Set appropriate priorities (high for critical tasks like visas, medium for bookings, low for nice-to-haves)
- Consider the trip dates when setting priorities (urgent if trip is soon)
- Make tasks actionable and specific
- Include destination names in destination-specific tasks

Return ONLY a JSON array of task objects. Each task must have:
- title (string, concise and actionable)
- description (string, optional, more details if helpful)
- category (string, one of: general, visa, accommodation, transportation, health, finance, packing, activities, documentation)
- priority (string, one of: high, medium, low)
- completed (boolean, always false)

Example:
[
  {
    "title": "Apply for Japan visa",
    "description": "Visit embassy website and submit visa application with required documents. Recommended: 4 weeks before trip",
    "category": "visa",
    "priority": "high",
    "completed": false
  },
  {
    "title": "Book accommodation in Tokyo",
    "description": "Find and book hotel or Airbnb for Tokyo portion of trip. Recommended: 3 weeks before trip",
    "category": "accommodation",
    "priority": "high",
    "completed": false
  }
]
"""

    def _build_prompt(self, trip_data: Dict[str, Any]) -> str:
        """Build the prompt for task generation."""
        destinations_str = ", ".join(trip_data.get("destinations", []))
        preferences_str = ", ".join(trip_data.get("preferences", []))
        transportation_str = ", ".join(trip_data.get("transportation", []))

        prompt = f"""Generate a comprehensive task list for this trip:

Trip Name: {trip_data.get('name', 'Trip')}
Description: {trip_data.get('description', 'A trip')}

Destinations: {destinations_str}
Start Point: {trip_data.get('start_point', 'N/A')}
End Point: {trip_data.get('end_point', 'N/A')}
Dates: {trip_data.get('start_date')} to {trip_data.get('end_date')}

Travelers: {trip_data.get('adults_count', 1)} adults, {trip_data.get('children_count', 0)} children
Preferences: {preferences_str}
Transportation: {transportation_str}
Budget: {trip_data.get('budget')} {trip_data.get('currency')}

Generate a complete task list covering:
1. Pre-trip planning tasks (visas, vaccinations, insurance)
2. Booking tasks (flights, accommodation, activities)
3. Financial preparation (currency, budget, cards)
4. Packing and preparation
5. Destination-specific requirements for: {destinations_str}

Return ONLY a JSON array of task objects. Be specific and actionable.
"""
        return prompt

    def _parse_task_response(self, response_text: str) -> List[Dict[str, Any]]:
        """Parse the LLM response into a list of task dictionaries."""
        try:
            # Try to extract JSON array from response
            json_match = re.search(r'\[[\s\S]*\]', response_text)
            if json_match:
                json_str = json_match.group(0)
                tasks = json.loads(json_str)

                # Validate and clean tasks
                valid_tasks = []
                for task in tasks:
                    if isinstance(task, dict) and "title" in task and "category" in task:
                        valid_task = {
                            "title": task.get("title", ""),
                            "description": task.get("description"),
                            "category": task.get("category", "general"),
                            "priority": task.get("priority", "medium"),
                            "completed": False
                        }
                        valid_tasks.append(valid_task)

                return valid_tasks if valid_tasks else self._get_default_fallback_tasks()
            else:
                print("No JSON array found in response")
                return self._get_default_fallback_tasks()

        except json.JSONDecodeError as e:
            print(f"Error parsing JSON from response: {e}")
            return self._get_default_fallback_tasks()

    def _get_fallback_tasks(self, trip_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate fallback tasks based on trip data when LLM fails."""
        destinations = trip_data.get("destinations", [])
        has_international = len(destinations) > 0  # Simplified check

        tasks = [
            {
                "title": "Book flights",
                "description": f"Book flights to {destinations[0] if destinations else 'destination'}. Recommended: 4 weeks before trip",
                "category": "transportation",
                "priority": "high",
                "completed": False
            },
            {
                "title": "Get travel insurance",
                "description": "Purchase comprehensive travel insurance covering medical, cancellation, and baggage. Recommended: 3 weeks before trip",
                "category": "general",
                "priority": "high",
                "completed": False
            },
        ]

        # Add destination-specific tasks
        for destination in destinations:
            tasks.append({
                "title": f"Book accommodation in {destination}",
                "description": f"Find and reserve lodging in {destination}. Recommended: 3 weeks before trip",
                "category": "accommodation",
                "priority": "high",
                "completed": False
            })

            tasks.append({
                "title": f"Research visa requirements for {destination}",
                "description": f"Check if visa is required for {destination} and apply if necessary. Recommended: 6 weeks before trip",
                "category": "visa",
                "priority": "high",
                "completed": False
            })

        # Add general tasks
        general_tasks = [
            {
                "title": "Notify bank of travel plans",
                "description": "Inform your bank and credit card companies of travel dates to avoid card blocks. Recommended: 1 week before trip",
                "category": "finance",
                "priority": "medium",
                "completed": False
            },
            {
                "title": "Check passport validity",
                "description": "Ensure passport is valid for at least 6 months after trip end date. Recommended: 8 weeks before trip",
                "category": "documentation",
                "priority": "high",
                "completed": False
            },
            {
                "title": "Pack luggage",
                "description": "Pack appropriate clothing and essentials for the trip. Recommended: 2 days before trip",
                "category": "packing",
                "priority": "medium",
                "completed": False
            },
        ]

        tasks.extend(general_tasks)
        return tasks

    def _get_default_fallback_tasks(self) -> List[Dict[str, Any]]:
        """Get absolute minimal fallback tasks."""
        return [
            {
                "title": "Book flights",
                "description": "Book flights for your trip. Recommended: 4 weeks before trip",
                "category": "transportation",
                "priority": "high",
                "completed": False
            },
            {
                "title": "Book accommodation",
                "description": "Reserve hotels or other lodging. Recommended: 3 weeks before trip",
                "category": "accommodation",
                "priority": "high",
                "completed": False
            },
            {
                "title": "Get travel insurance",
                "description": "Purchase travel insurance. Recommended: 3 weeks before trip",
                "category": "general",
                "priority": "high",
                "completed": False
            },
        ]


# Singleton instance
_task_agent_instance = None

def get_task_agent() -> TaskAgent:
    """Get or create the singleton task agent instance."""
    global _task_agent_instance
    if _task_agent_instance is None:
        _task_agent_instance = TaskAgent()
    return _task_agent_instance
