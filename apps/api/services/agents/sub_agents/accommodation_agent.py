"""Sub-agent for researching and recommending accommodations for destinations."""

import os
import json
from typing import List, Dict, Any, Optional
from perplexity import Perplexity
from datetime import datetime


class AccommodationAgent:
    """
    Sub-agent responsible for researching accommodation options for destinations
    and providing tailored recommendations based on budget and preferences.

    Uses Perplexity AI to research up-to-date accommodation options from
    reliable sources like booking platforms and travel guides.
    """

    def __init__(self):
        """Initialize the accommodation agent with Perplexity client."""
        self.api_key = os.getenv("PERPLEXITY_API_KEY")
        if self.api_key:
            self.client = Perplexity(api_key=self.api_key)
        else:
            self.client = None
            print("[ACCOMMODATION AGENT] ⚠️  Warning: PERPLEXITY_API_KEY not set in environment")

    def recommend_accommodations(
        self,
        destination: str,
        trip_data: Dict[str, Any],
        nights_count: int,
        range_type: str = "all"  # "all", "budget", "mid-range", "luxury"
    ) -> List[Dict[str, Any]]:
        """
        Generate accommodation recommendations for a specific destination.

        Args:
            destination: Destination name (e.g., "Tokyo, Japan")
            trip_data: Dictionary containing trip information (budget, preferences, etc.)
            nights_count: Number of nights staying in this destination
            range_type: Type of recommendations - "all" (budget/mid-range/luxury),
                       "budget", "mid-range", or "luxury"

        Returns:
            List of accommodation recommendation dictionaries
        """
        print("\n" + "=" * 80)
        print(f"[ACCOMMODATION AGENT] Starting accommodation recommendations for {destination}")
        print("=" * 80)

        if not self.client:
            print("[ACCOMMODATION AGENT] ❌ Perplexity client not initialized, skipping")
            return []

        # Extract trip details
        total_budget = trip_data.get("budget", 0)
        currency = trip_data.get("currency", "USD")
        preferences = trip_data.get("preferences", [])
        adults_count = trip_data.get("adults_count", 1)
        children_count = trip_data.get("children_count", 0)
        start_date = trip_data.get("start_date", "")

        # Calculate budget allocation for this destination
        total_nights = self._calculate_total_nights(trip_data)
        budget_per_night = (total_budget / total_nights) if total_nights > 0 else 0
        destination_budget = budget_per_night * nights_count

        print(f"[ACCOMMODATION AGENT] Destination: {destination}")
        print(f"[ACCOMMODATION AGENT] Nights: {nights_count}")
        print(f"[ACCOMMODATION AGENT] Total trip budget: {total_budget} {currency}")
        print(f"[ACCOMMODATION AGENT] Estimated budget for this destination: {destination_budget:.2f} {currency}")
        print(f"[ACCOMMODATION AGENT] Travelers: {adults_count} adults, {children_count} children")
        print(f"[ACCOMMODATION AGENT] Preferences: {', '.join(preferences) if preferences else 'None'}")
        print(f"[ACCOMMODATION AGENT] Range type: {range_type}")

        # Research accommodations
        print(f"\n[ACCOMMODATION AGENT] 🔍 Researching accommodations via Perplexity...")
        research_result = self._research_accommodations(
            destination,
            budget_per_night,
            currency,
            preferences,
            adults_count,
            children_count,
            start_date,
            range_type
        )

        if not research_result:
            print("[ACCOMMODATION AGENT] ⚠️  No accommodation information retrieved")
            return []

        # Parse research results and create recommendations
        print(f"\n[ACCOMMODATION AGENT] 📋 Parsing accommodation recommendations...")
        recommendations = self._parse_recommendations(
            research_result,
            destination,
            nights_count,
            budget_per_night,
            currency,
            range_type
        )

        print(f"\n[ACCOMMODATION AGENT] ✓ Total recommendations generated: {len(recommendations)}")
        print("=" * 80 + "\n")

        return recommendations

    def _calculate_total_nights(self, trip_data: Dict[str, Any]) -> int:
        """Calculate total nights for the trip."""
        start_date = trip_data.get("start_date")
        end_date = trip_data.get("end_date")

        if not start_date or not end_date:
            return 7  # Default

        try:
            start = datetime.fromisoformat(str(start_date))
            end = datetime.fromisoformat(str(end_date))
            nights = (end - start).days
            return max(nights, 1)
        except:
            return 7

    def _research_accommodations(
        self,
        destination: str,
        budget_per_night: float,
        currency: str,
        preferences: List[str],
        adults_count: int,
        children_count: int,
        start_date: str,
        range_type: str
    ) -> Optional[str]:
        """
        Use Perplexity AI to research accommodation options.

        Args:
            destination: Destination name
            budget_per_night: Budget allocated per night
            currency: Currency code
            preferences: User preferences
            adults_count: Number of adults
            children_count: Number of children
            start_date: Trip start date
            range_type: Type of recommendations requested

        Returns:
            Research results as JSON string or None if API fails
        """
        # Common JSON instruction ensuring strict format
        json_instruction = f"""
IMPORTANT: Return ONLY a raw JSON array. Do not use markdown code blocks. Do not add explanations.
The output must be a valid JSON array of 3 objects with this exact schema:
[
  {{
    "name": "Property Name",
    "type": "hotel/hostel/resort/etc",
    "price_per_night": 100,
    "currency": "{currency}",
    "location": "Neighborhood name",
    "description": "Brief description...",
    "why_fits": "Reasoning...",
    "range_category": "budget/mid-range/luxury"
  }}
]
"""

        # Build the research query based on range_type
        base_context = f"""
Trip Details:
- Destination: {destination}
- Approx Budget per night: {budget_per_night:.0f} {currency}
- Travelers: {adults_count} adult(s), {children_count} child(ren)
- Date: {start_date if start_date else 'Upcoming'}
- Preferences: {', '.join(preferences) if preferences else 'None specified'}
"""

        if range_type == "all":
            query = f"""I need 3 accommodation recommendations in {destination}:
1. One BUDGET option
2. One MID-RANGE option
3. One LUXURY option

{base_context}

For "budget", look for hostels or cheap hotels around {budget_per_night * 0.5:.0f} {currency}.
For "mid-range", look for comfortable hotels around {budget_per_night:.0f} {currency}.
For "luxury", look for high-end options above {budget_per_night * 1.5:.0f} {currency}.

{json_instruction}
"""
        elif range_type == "budget":
            query = f"""I need 3 BUDGET accommodation recommendations in {destination}.
Focus on clean, safe, affordable options (hostels, guesthouses, budget hotels).

{base_context}

{json_instruction}
"""
        elif range_type == "mid-range":
            query = f"""I need 3 MID-RANGE accommodation recommendations in {destination}.
Focus on good value, comfort, and location.

{base_context}

{json_instruction}
"""
        else:  # luxury
            query = f"""I need 3 LUXURY accommodation recommendations in {destination}.
Focus on 5-star properties, resorts, and premium amenities.

{base_context}

{json_instruction}
"""

        try:
            print(f"[ACCOMMODATION AGENT]   📡 Querying Perplexity (model: sonar)...")

            completion = self.client.chat.completions.create(
                model="sonar",
                messages=[
                    {"role": "user", "content": query}
                ]
            )

            response_text = completion.choices[0].message.content

            # Log citations if available
            if hasattr(completion, 'citations') and completion.citations:
                print(f"[ACCOMMODATION AGENT]   ✓ Retrieved {len(completion.citations)} citations")
                for i, citation in enumerate(completion.citations[:3], 1):
                    print(f"[ACCOMMODATION AGENT]     {i}. {citation}")

            print(f"[ACCOMMODATION AGENT]   ✓ Response length: {len(response_text)} characters")

            return response_text

        except Exception as e:
            print(f"[ACCOMMODATION AGENT]   ❌ Error calling Perplexity API: {e}")
            import traceback
            traceback.print_exc()
            return None

    def _parse_recommendations(
        self,
        research_text: str,
        destination: str,
        nights_count: int,
        budget_per_night: float,
        currency: str,
        range_type: str
    ) -> List[Dict[str, Any]]:
        """
        Parse Perplexity JSON research results and create recommendation objects.

        Args:
            research_text: Research results from Perplexity
            destination: Destination name
            nights_count: Number of nights
            budget_per_night: Budget per night
            currency: Currency code
            range_type: Range type requested

        Returns:
            List of accommodation recommendation dictionaries
        """
        recommendations = []
        parsed_items = []

        try:
            # Clean up the response text to ensure it's valid JSON
            # Remove markdown code blocks if present
            clean_text = research_text.strip()
            if clean_text.startswith("```json"):
                clean_text = clean_text[7:]
            elif clean_text.startswith("```"):
                clean_text = clean_text[3:]
            if clean_text.endswith("```"):
                clean_text = clean_text[:-3]

            clean_text = clean_text.strip()

            # Parse JSON
            parsed_items = json.loads(clean_text)

            if not isinstance(parsed_items, list):
                print(f"[ACCOMMODATION AGENT]   ⚠️  Parsed JSON is not a list: {type(parsed_items)}")
                parsed_items = []

        except json.JSONDecodeError as e:
            print(f"[ACCOMMODATION AGENT]   ⚠️  JSON decode error: {e}")
            print(f"[ACCOMMODATION AGENT]   Raw text start: {research_text[:100]}...")
            # Attempt to extract JSON array from text if it's embedded
            try:
                start_idx = research_text.find('[')
                end_idx = research_text.rfind(']')
                if start_idx != -1 and end_idx != -1:
                    json_str = research_text[start_idx:end_idx+1]
                    parsed_items = json.loads(json_str)
            except Exception as e2:
                print(f"[ACCOMMODATION AGENT]   ❌ Failed to extract JSON from text: {e2}")

        # Validation and processing
        valid_items = []
        for item in parsed_items:
            if not isinstance(item, dict):
                continue

            # Ensure required fields
            if "name" not in item:
                continue

            # Normalize price
            try:
                price = float(item.get("price_per_night", 0))
            except (ValueError, TypeError):
                price = 0

            item["price_per_night"] = price

            # Ensure range category
            if "range_category" not in item or item["range_category"] not in ["budget", "mid-range", "luxury"]:
                item["range_category"] = self._determine_range_category(
                    price, budget_per_night, range_type
                )

            valid_items.append(item)

        # Fallbacks if needed
        if len(valid_items) < 3:
            print(f"[ACCOMMODATION AGENT]   ⚠️  Got {len(valid_items)} valid items, adding fallbacks")
            while len(valid_items) < 3:
                valid_items.append(self._create_fallback_recommendation(
                    destination,
                    len(valid_items) + 1,
                    budget_per_night,
                    currency,
                    range_type
                ))

        # Create final recommendation objects
        for i, item in enumerate(valid_items[:3]):
            price = item.get("price_per_night", 0)
            total_cost = price * nights_count

            recommendation = {
                "destination": destination,
                "name": item.get("name", f"Option {i+1}"),
                "type": item.get("type", "hotel"),
                "price_per_night": price,
                "currency": currency,  # Force the requested currency
                "total_cost": total_cost,
                "nights_count": nights_count,
                "location": item.get("location", destination),
                "description": item.get("description", ""),
                "why_fits": item.get("why_fits", ""),
                "range_category": item.get("range_category", "mid-range")
            }

            recommendations.append(recommendation)

            print(f"[ACCOMMODATION AGENT]   {i + 1}. {recommendation['name']}")
            print(f"[ACCOMMODATION AGENT]      Type: {recommendation['type']}, Range: {recommendation['range_category']}")
            print(f"[ACCOMMODATION AGENT]      Price: {recommendation['price_per_night']} {currency}/night (Total: {total_cost} {currency})")

        return recommendations

    def _determine_range_category(
        self,
        price: float,
        budget_per_night: float,
        requested_range: str
    ) -> str:
        """Determine the range category based on price and budget."""
        if requested_range != "all":
            return requested_range

        if price <= budget_per_night * 0.6:
            return "budget"
        elif price <= budget_per_night * 1.2:
            return "mid-range"
        else:
            return "luxury"

    def _create_fallback_recommendation(
        self,
        destination: str,
        index: int,
        budget_per_night: float,
        currency: str,
        range_type: str
    ) -> Dict[str, Any]:
        """Create a fallback recommendation when parsing fails."""

        if range_type == "all":
            categories = ["budget", "mid-range", "luxury"]
            category = categories[(index - 1) % 3]
        else:
            category = range_type

        # Set price based on category - ensure minimum price
        if category == "budget":
            price = max(int(budget_per_night * 0.5), 20)
            type_name = "hostel"
            description = "A clean and comfortable budget accommodation option with basic amenities."
            name = f"{destination} Budget Hostel"
        elif category == "mid-range":
            price = max(int(budget_per_night), 50)
            type_name = "hotel"
            description = "A well-located hotel with good amenities and comfortable rooms."
            name = f"{destination} Central Hotel"
        else:  # luxury
            price = max(int(budget_per_night * 1.8), 100)
            type_name = "hotel"
            description = "An upscale property offering premium amenities and exceptional service."
            name = f"{destination} Luxury Resort"

        return {
            "name": name,
            "type": type_name,
            "price_per_night": price,
            "location": destination,
            "description": description,
            "why_fits": f"This {category} option fits within the trip budget and offers good value.",
            "range_category": category
        }


# Singleton instance
_accommodation_agent_instance = None


def get_accommodation_agent() -> AccommodationAgent:
    """Get or create the singleton accommodation agent instance."""
    global _accommodation_agent_instance
    if _accommodation_agent_instance is None:
        _accommodation_agent_instance = AccommodationAgent()
    return _accommodation_agent_instance
