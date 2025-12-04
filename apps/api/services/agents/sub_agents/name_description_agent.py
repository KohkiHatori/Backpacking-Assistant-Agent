"""Sub-agent for generating trip name and description using Gemini 2.5 Flash."""

import json
from typing import Dict, Any
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage
import os


class NameDescriptionAgent:
    """Sub-agent responsible for generating creative trip names and descriptions."""

    def __init__(self):
        """Initialize the agent with Gemini 2.5 Flash model."""
        self.model = ChatGoogleGenerativeAI(
            model="gemini-2.0-flash-exp",
            google_api_key=os.getenv("GEMINI_API_KEY"),
            temperature=0.7,
        )

    def generate_name_and_description(self, trip_data: Dict[str, Any]) -> Dict[str, str]:
        """
        Generate a catchy trip name and engaging description based on trip details.

        Args:
            trip_data: Dictionary containing trip information

        Returns:
            Dictionary with 'name' and 'description' keys
        """
        # Format travelers text
        travelers_text = self._format_travelers(
            trip_data.get("adults_count", 1),
            trip_data.get("children_count", 0)
        )

        # Format dates
        dates_text = self._format_dates(
            trip_data.get("flexible_dates", False),
            trip_data.get("start_date"),
            trip_data.get("end_date")
        )

        # Build the prompt
        prompt = self._build_prompt(trip_data, travelers_text, dates_text)

        try:
            # Create messages for the LLM
            messages = [
                SystemMessage(content=self._get_system_prompt()),
                HumanMessage(content=prompt)
            ]

            # Invoke the model
            response = self.model.invoke(messages)

            # Parse the response
            result = self._parse_response(response.content)

            return result

        except Exception as e:
            print(f"Error generating trip name and description: {e}")
            # Fallback to default values
            return self._get_fallback_response(trip_data)

    def _get_system_prompt(self) -> str:
        """Get the system prompt for the agent."""
        return """You are a creative travel content specialist. Your task is to generate
catchy, memorable trip names and engaging one-sentence descriptions that capture the essence
of a journey.

Guidelines:
- Trip names should be concise (3-7 words), evocative, and memorable
- Descriptions should be one sentence that excites and informs
- Incorporate key destinations and trip themes
- Match the tone to the trip type (adventure, luxury, family, cultural, etc.)
- Be specific but not overly detailed
- Return ONLY a valid JSON object with "name" and "description" properties

Example output:
{
  "name": "Kyoto to Tokyo: Temple & Tech",
  "description": "Experience ancient traditions and futuristic innovations on a cultural journey through Japan's most iconic cities."
}"""

    def _build_prompt(self, trip_data: Dict[str, Any], travelers_text: str, dates_text: str) -> str:
        """Build the prompt for generation."""
        destinations = ", ".join(trip_data.get("destinations", [])) or "Not specified"
        start_point = trip_data.get("start_point") or "Not specified"
        end_point = trip_data.get("end_point") or "Not specified"
        preferences = ", ".join(trip_data.get("preferences", [])) or "None"
        transportation = ", ".join(trip_data.get("transportation", [])) or "Not specified"
        budget = trip_data.get("budget", 0)
        currency = trip_data.get("currency", "USD")

        return f"""Based on the following trip details, generate a catchy name and a short, engaging one-sentence description.

Destinations: {destinations}
Start Point: {start_point}
End Point: {end_point}
Dates: {dates_text}
Travelers: {travelers_text}
Preferences: {preferences}
Transportation: {transportation}
Budget: {budget} {currency}

Return the result as a JSON object with "name" and "description" properties."""

    def _format_travelers(self, adults_count: int, children_count: int) -> str:
        """Format the travelers text."""
        if children_count > 0:
            adults_text = f"{adults_count} adult{'s' if adults_count > 1 else ''}"
            children_text = f"{children_count} child{'ren' if children_count > 1 else ''}"
            return f"{adults_text} and {children_text}"
        return f"{adults_count} adult{'s' if adults_count > 1 else ''}"

    def _format_dates(self, flexible: bool, start_date: str | None, end_date: str | None) -> str:
        """Format the dates text."""
        if flexible:
            return "Flexible"
        if start_date and end_date:
            return f"{start_date} to {end_date}"
        return "Not specified"

    def _parse_response(self, response_text: str) -> Dict[str, str]:
        """Parse the LLM response and extract JSON."""
        # Clean the response text
        cleaned_text = response_text.strip()

        # Remove markdown code blocks if present
        if "```json" in cleaned_text:
            cleaned_text = cleaned_text.split("```json")[1].split("```")[0].strip()
        elif "```" in cleaned_text:
            cleaned_text = cleaned_text.split("```")[1].split("```")[0].strip()

        # Parse JSON
        try:
            result = json.loads(cleaned_text)

            # Validate required fields
            if "name" not in result or "description" not in result:
                raise ValueError("Missing required fields in response")

            return {
                "name": result["name"],
                "description": result["description"]
            }
        except (json.JSONDecodeError, ValueError) as e:
            print(f"Error parsing JSON response: {e}")
            print(f"Response text: {cleaned_text}")
            raise

    def _get_fallback_response(self, trip_data: Dict[str, Any]) -> Dict[str, str]:
        """Generate fallback response if LLM fails."""
        destinations = trip_data.get("destinations", [])
        if destinations:
            destination = destinations[0]
        else:
            destination = trip_data.get("end_point") or "Unknown"

        return {
            "name": f"Trip to {destination}",
            "description": "An amazing adventure awaits!"
        }


# Singleton instance
_agent_instance = None


def get_name_description_agent() -> NameDescriptionAgent:
    """Get or create the singleton instance of NameDescriptionAgent."""
    global _agent_instance
    if _agent_instance is None:
        _agent_instance = NameDescriptionAgent()
    return _agent_instance
