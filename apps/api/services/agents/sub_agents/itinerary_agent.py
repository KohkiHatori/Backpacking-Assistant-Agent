"""Sub-agent for generating and modifying trip itineraries."""

import json
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage
import os


class ItineraryAgent:
    """Sub-agent responsible for generating and modifying trip itineraries."""

    def __init__(self):
        """Initialize the agent with Gemini 2.5 Flash model."""
        self.model = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            google_api_key=os.getenv("GEMINI_API_KEY"),
            temperature=0.7,
        )

    def generate_single_day(
        self,
        trip_data: Dict[str, Any],
        day_number: int,
        previous_days_summary: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Generate itinerary for a single day.

        Args:
            trip_data: Dictionary containing trip information
            day_number: Which day to generate (1-based)
            previous_days_summary: Optional summary of previous days for context

        Returns:
            List of itinerary items for that day
        """
        from datetime import datetime, timedelta

        # Calculate the specific date for this day
        start_date = datetime.fromisoformat(trip_data.get("start_date"))
        current_date = start_date + timedelta(days=day_number - 1)

        # Build prompt for single day
        prompt = self._build_single_day_prompt(
            trip_data,
            day_number,
            current_date.strftime("%Y-%m-%d"),
            previous_days_summary
        )

        try:
            messages = [
                SystemMessage(content=self._get_system_prompt()),
                HumanMessage(content=prompt)
            ]

            response = self.model.invoke(messages)

            # Parse response for single day
            itinerary_items = self._parse_single_day_response(
                response.content,
                trip_data,
                day_number,
                current_date.strftime("%Y-%m-%d")
            )

            return itinerary_items

        except Exception as e:
            print(f"Error generating day {day_number}: {e}")
            return self._get_fallback_day(trip_data, day_number, current_date.strftime("%Y-%m-%d"))

    def generate_itinerary(self, trip_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Generate a complete day-by-day itinerary for a trip.

        Args:
            trip_data: Dictionary containing trip information

        Returns:
            List of itinerary items
        """
        # Calculate number of days
        num_days = self._calculate_days(
            trip_data.get("start_date"),
            trip_data.get("end_date")
        )

        # Build the prompt
        prompt = self._build_generation_prompt(trip_data, num_days)

        try:
            # Create messages for the LLM
            messages = [
                SystemMessage(content=self._get_system_prompt()),
                HumanMessage(content=prompt)
            ]

            # Invoke the model
            response = self.model.invoke(messages)

            # Parse the response
            itinerary_items = self._parse_itinerary_response(response.content, trip_data)

            return itinerary_items

        except Exception as e:
            print(f"Error generating itinerary: {e}")
            # Return basic fallback itinerary
            return self._get_fallback_itinerary(trip_data, num_days)

    def modify_itinerary(
        self,
        existing_items: List[Dict[str, Any]],
        modification_request: str,
        trip_data: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Modify existing itinerary based on new requirements or information.

        Args:
            existing_items: Current itinerary items
            modification_request: User's modification request
            trip_data: Trip information

        Returns:
            Modified itinerary items
        """
        # Build modification prompt
        prompt = self._build_modification_prompt(existing_items, modification_request, trip_data)

        try:
            messages = [
                SystemMessage(content=self._get_system_prompt()),
                HumanMessage(content=prompt)
            ]

            response = self.model.invoke(messages)
            modified_items = self._parse_itinerary_response(response.content, trip_data)

            return modified_items

        except Exception as e:
            print(f"Error modifying itinerary: {e}")
            return existing_items  # Return unchanged if error

    def _get_system_prompt(self) -> str:
        """Get the system prompt for the itinerary agent."""
        return """You are an expert travel planner specializing in creating detailed,
realistic, and enjoyable itineraries for backpackers and travelers.

Your task is to generate day-by-day itineraries that:
- Balance activities with rest time
- Consider realistic travel times between locations
- Match the traveler's preferences and budget
- Include specific activities, times, and locations
- Provide variety (cultural sites, food experiences, nature, etc.)
- Account for opening hours and practical constraints
- Include transportation details

Return the itinerary as a JSON array of items, where each item has:
{
  "day_number": 1,
  "date": "2024-06-01",
  "start_time": "09:00:00",
  "end_time": "12:00:00",
  "title": "Activity name",
  "description": "Detailed description",
  "location": "Specific location name",
  "type": "activity|transport|accommodation|meal",
  "cost": 0,
  "order_index": 0
}

Be specific and practical. Include estimated costs in the local currency."""

    def _build_generation_prompt(self, trip_data: Dict[str, Any], num_days: int) -> str:
        """Build the prompt for initial itinerary generation."""
        destinations = ", ".join(trip_data.get("destinations", []))
        preferences = ", ".join(trip_data.get("preferences", []))
        transportation = ", ".join(trip_data.get("transportation", []))

        return f"""Create a detailed {num_days}-day itinerary for the following trip:

**Trip Details:**
- Destinations: {destinations}
- Start Point: {trip_data.get("start_point", "Not specified")}
- End Point: {trip_data.get("end_point", "Not specified")}
- Dates: {trip_data.get("start_date")} to {trip_data.get("end_date")}
- Travelers: {trip_data.get("adults_count", 1)} adults, {trip_data.get("children_count", 0)} children
- Budget: {trip_data.get("budget")} {trip_data.get("currency")}
- Preferences: {preferences or "None specified"}
- Transportation: {transportation or "Not specified"}

**Instructions:**
1. Create a day-by-day schedule covering all {num_days} days
2. Include 4-6 activities per day
3. Add meal suggestions (breakfast, lunch, dinner)
4. Include transportation between major locations
5. Suggest accommodation for each night
6. Balance activity with relaxation
7. Stay within the budget
8. Match the preferences and travel style

Return ONLY a JSON array of itinerary items, no other text."""

    def _build_modification_prompt(
        self,
        existing_items: List[Dict[str, Any]],
        modification: str,
        trip_data: Dict[str, Any]
    ) -> str:
        """Build the prompt for modifying existing itinerary."""
        existing_json = json.dumps(existing_items, indent=2)

        return f"""Modify the following itinerary based on the user's request.

**Current Itinerary:**
```json
{existing_json}
```

**Modification Request:**
{modification}

**Trip Context:**
- Budget: {trip_data.get("budget")} {trip_data.get("currency")}
- Preferences: {", ".join(trip_data.get("preferences", []))}
- Travelers: {trip_data.get("adults_count", 1)} adults, {trip_data.get("children_count", 0)} children

**Instructions:**
1. Apply the requested modifications
2. Ensure the itinerary still flows logically
3. Adjust subsequent days if needed
4. Maintain realistic timing and transitions
5. Stay within budget constraints

Return ONLY the complete modified JSON array, no other text."""

    def _parse_itinerary_response(self, response_text: str, trip_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Parse the LLM response and extract itinerary items."""
        # Clean the response text
        cleaned_text = response_text.strip()

        # Remove markdown code blocks if present
        if "```json" in cleaned_text:
            cleaned_text = cleaned_text.split("```json")[1].split("```")[0].strip()
        elif "```" in cleaned_text:
            cleaned_text = cleaned_text.split("```")[1].split("```")[0].strip()

        # Parse JSON
        try:
            items = json.loads(cleaned_text)

            if not isinstance(items, list):
                raise ValueError("Response is not a list")

            # Validate and enhance items
            validated_items = []
            for idx, item in enumerate(items):
                validated_item = {
                    "day_number": item.get("day_number", 1),
                    "date": item.get("date", trip_data.get("start_date")),
                    "start_time": item.get("start_time", "09:00:00"),
                    "end_time": item.get("end_time", "10:00:00"),
                    "title": item.get("title", "Activity"),
                    "description": item.get("description", ""),
                    "location": item.get("location", ""),
                    "type": item.get("type", "activity"),
                    "cost": item.get("cost", 0),
                    "order_index": item.get("order_index", idx)
                }
                validated_items.append(validated_item)

            return validated_items

        except (json.JSONDecodeError, ValueError) as e:
            print(f"Error parsing itinerary JSON: {e}")
            print(f"Response text: {cleaned_text[:500]}")
            raise

    def _calculate_days(self, start_date: str, end_date: str) -> int:
        """Calculate number of days between start and end date."""
        if not start_date or not end_date:
            return 7  # Default to 7 days

        try:
            start = datetime.fromisoformat(start_date)
            end = datetime.fromisoformat(end_date)
            return (end - start).days + 1
        except:
            return 7

    def _get_fallback_itinerary(self, trip_data: Dict[str, Any], num_days: int) -> List[Dict[str, Any]]:
        """Generate a basic fallback itinerary if AI generation fails."""
        items = []
        start_date = trip_data.get("start_date", datetime.now().isoformat()[:10])
        destinations = trip_data.get("destinations", ["Unknown"])

        for day in range(num_days):
            current_date = (datetime.fromisoformat(start_date) + timedelta(days=day)).isoformat()[:10]
            destination = destinations[day % len(destinations)]

            # Morning activity
            items.append({
                "day_number": day + 1,
                "date": current_date,
                "start_time": "09:00:00",
                "end_time": "12:00:00",
                "title": f"Explore {destination}",
                "description": f"Morning exploration of {destination} attractions",
                "location": destination,
                "type": "activity",
                "cost": 0,
                "order_index": len(items)
            })

            # Afternoon activity
            items.append({
                "day_number": day + 1,
                "date": current_date,
                "start_time": "14:00:00",
                "end_time": "17:00:00",
                "title": f"Visit local sites in {destination}",
                "description": f"Afternoon activities in {destination}",
                "location": destination,
                "type": "activity",
                "cost": 0,
                "order_index": len(items)
            })

        return items

    def _build_single_day_prompt(
        self,
        trip_data: Dict[str, Any],
        day_number: int,
        date: str,
        previous_days_summary: Optional[str]
    ) -> str:
        """Build prompt for generating a single day's itinerary."""
        context = f"""Generate a detailed itinerary for DAY {day_number} of this trip:

**Trip Overview:**
- Destinations: {', '.join(trip_data.get('destinations', []))}
- Date for Day {day_number}: {date}
- Travelers: {trip_data.get('adults_count', 1)} adults, {trip_data.get('children_count', 0)} children
- Preferences: {', '.join(trip_data.get('preferences', []))}
- Budget: {trip_data.get('budget', 0)} {trip_data.get('currency', 'USD')} total
- Transportation: {', '.join(trip_data.get('transportation', []))}
"""

        if previous_days_summary:
            context += f"\n**Previous Days Summary:**\n{previous_days_summary}\n"

        context += f"""
Create 4-6 activities/events for Day {day_number}. Include:
- Morning activity (breakfast + main activity)
- Lunch
- Afternoon activity
- Dinner
- Optional evening activity

Return as JSON array with objects containing:
- title: Activity name
- start_time: "HH:MM:SS"
- end_time: "HH:MM:SS"
- description: Detailed description
- location: Place name
- type: "activity", "meal", "transport", or "accommodation"
- cost: Estimated cost in cents (0 if unknown)

Make it realistic, engaging, and respect the budget/preferences.
"""
        return context

    def _parse_single_day_response(
        self,
        response_text: str,
        trip_data: Dict[str, Any],
        day_number: int,
        date: str
    ) -> List[Dict[str, Any]]:
        """Parse LLM response for a single day."""
        import json
        import re

        # Try to extract JSON from response
        try:
            # Remove markdown code blocks if present
            cleaned_text = re.sub(r'```(?:json)?\s*', '', response_text)
            cleaned_text = cleaned_text.strip()

            # Parse JSON
            items = json.loads(cleaned_text)

            # Add day_number, date, and order_index
            for i, item in enumerate(items):
                item['day_number'] = day_number
                item['date'] = date
                item['order_index'] = i

            return items

        except Exception as e:
            print(f"Error parsing single day response: {e}")
            return self._get_fallback_day(trip_data, day_number, date)

    def _get_fallback_day(
        self,
        trip_data: Dict[str, Any],
        day_number: int,
        date: str
    ) -> List[Dict[str, Any]]:
        """Generate fallback itinerary for a single day."""
        destination = trip_data.get('destinations', ['Unknown'])[0]

        return [
            {
                'day_number': day_number,
                'date': date,
                'start_time': '09:00:00',
                'end_time': '17:00:00',
                'title': f'Explore {destination}',
                'description': f'Spend the day exploring {destination} and its main attractions.',
                'location': destination,
                'type': 'activity',
                'cost': 0,
                'order_index': 0
            }
        ]


# Singleton instance
_agent_instance = None


def get_itinerary_agent() -> ItineraryAgent:
    """Get or create the singleton instance of ItineraryAgent."""
    global _agent_instance
    if _agent_instance is None:
        _agent_instance = ItineraryAgent()
    return _agent_instance
