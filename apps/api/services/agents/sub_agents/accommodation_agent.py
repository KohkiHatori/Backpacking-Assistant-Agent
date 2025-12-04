"""Sub-agent for researching and recommending accommodations for destinations."""

import os
import json
import re
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
            Research results as text or None if API fails
        """
        # Build the research query based on range_type
        if range_type == "all":
            query = f"""I need 3 accommodation recommendations in {destination} with different price ranges:
1. One BUDGET option (economical, hostel/guesthouse)
2. One MID-RANGE option (comfortable hotel/aparthotel)
3. One LUXURY option (upscale hotel/resort)

Trip Details:
- Destination: {destination}
- Approximate budget per night: {budget_per_night:.0f} {currency}
- Travelers: {adults_count} adult(s), {children_count} child(ren)
- Travel date: {start_date if start_date else 'Upcoming'}
- Preferences: {', '.join(preferences) if preferences else 'None specified'}

For EACH of the 3 recommendations, provide:
1. Property name
2. Type (hotel/hostel/airbnb/guesthouse/resort)
3. Price per night in {currency}
4. Location/neighborhood within {destination}
5. Brief description (1-2 sentences about amenities and atmosphere)
6. Why it fits (explain what makes it a good budget/mid-range/luxury choice)

Please provide current, realistic prices in {currency} and focus on well-reviewed, bookable properties."""

        elif range_type == "budget":
            query = f"""I need 3 BUDGET accommodation recommendations in {destination}.

Trip Details:
- Destination: {destination}
- Approximate budget per night: {budget_per_night:.0f} {currency}
- Travelers: {adults_count} adult(s), {children_count} child(ren)
- Travel date: {start_date if start_date else 'Upcoming'}
- Preferences: {', '.join(preferences) if preferences else 'None specified'}

For EACH of the 3 budget recommendations, provide:
1. Property name
2. Type (hostel/guesthouse/budget hotel)
3. Price per night in {currency}
4. Location/neighborhood
5. Brief description
6. Why it's a good value option

Focus on clean, safe, budget-friendly options with good reviews."""

        elif range_type == "mid-range":
            query = f"""I need 3 MID-RANGE accommodation recommendations in {destination}.

Trip Details:
- Destination: {destination}
- Approximate budget per night: {budget_per_night:.0f} {currency}
- Travelers: {adults_count} adult(s), {children_count} child(ren)
- Travel date: {start_date if start_date else 'Upcoming'}
- Preferences: {', '.join(preferences) if preferences else 'None specified'}

For EACH of the 3 mid-range recommendations, provide:
1. Property name
2. Type (hotel/aparthotel/boutique hotel)
3. Price per night in {currency}
4. Location/neighborhood
5. Brief description
6. Why it's a good value for money

Focus on comfortable, well-located properties with good amenities."""

        else:  # luxury
            query = f"""I need 3 LUXURY accommodation recommendations in {destination}.

Trip Details:
- Destination: {destination}
- Approximate budget per night: {budget_per_night:.0f} {currency}
- Travelers: {adults_count} adult(s), {children_count} child(ren)
- Travel date: {start_date if start_date else 'Upcoming'}
- Preferences: {', '.join(preferences) if preferences else 'None specified'}

For EACH of the 3 luxury recommendations, provide:
1. Property name
2. Type (5-star hotel/resort/luxury boutique)
3. Price per night in {currency}
4. Location/neighborhood
5. Brief description
6. Why it's exceptional

Focus on high-end properties with premium amenities and service."""

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
        Parse Perplexity research results and create recommendation objects.

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

        # Try to intelligently parse the response
        # The response should contain 3 recommendations

        # Split by common delimiters that might separate recommendations
        sections = re.split(r'\n\s*\n|\n(?=\d+\.|#{1,3}\s)', research_text)

        parsed_items = []

        for section in sections:
            section = section.strip()
            if not section or len(section) < 50:
                continue

            # Try to extract accommodation details from this section
            item = self._extract_accommodation_from_text(section, currency)
            if item:
                parsed_items.append(item)

        # If we successfully parsed items, use them
        if len(parsed_items) >= 3:
            parsed_items = parsed_items[:3]  # Take first 3
        elif len(parsed_items) > 0:
            # Pad with fallback if we got some but not enough
            while len(parsed_items) < 3:
                parsed_items.append(self._create_fallback_recommendation(
                    destination,
                    len(parsed_items) + 1,
                    budget_per_night,
                    currency,
                    range_type
                ))
        else:
            # Create fallback recommendations
            print("[ACCOMMODATION AGENT]   ⚠️  Could not parse recommendations, using fallback")
            for i in range(3):
                parsed_items.append(self._create_fallback_recommendation(
                    destination,
                    i + 1,
                    budget_per_night,
                    currency,
                    range_type
                ))

        # Convert parsed items to recommendation format
        for i, item in enumerate(parsed_items):
            total_cost = item.get("price_per_night", 0) * nights_count

            recommendation = {
                "destination": destination,
                "name": item.get("name", f"Accommodation Option {i + 1}"),
                "type": item.get("type", "hotel"),
                "price_per_night": item.get("price_per_night", 0),
                "currency": currency,
                "total_cost": total_cost,
                "nights_count": nights_count,
                "location": item.get("location", destination),
                "description": item.get("description", ""),
                "why_fits": item.get("why_fits", ""),
                "range_category": item.get("range_category", self._determine_range_category(
                    item.get("price_per_night", 0),
                    budget_per_night,
                    range_type
                ))
            }

            recommendations.append(recommendation)

            print(f"[ACCOMMODATION AGENT]   {i + 1}. {recommendation['name']}")
            print(f"[ACCOMMODATION AGENT]      Type: {recommendation['type']}, Range: {recommendation['range_category']}")
            print(f"[ACCOMMODATION AGENT]      Price: {recommendation['price_per_night']} {currency}/night (Total: {total_cost} {currency})")

        return recommendations

    def _extract_accommodation_from_text(self, text: str, currency: str) -> Optional[Dict[str, Any]]:
        """
        Extract accommodation details from a text section.

        Args:
            text: Text section containing accommodation info
            currency: Currency code

        Returns:
            Dictionary with accommodation details or None
        """
        item = {}

        # Extract name (often at the start or after numbering)
        name_patterns = [
            r'(?:^|\d+\.\s*)\*\*([^*\n]+)\*\*',  # **Name**
            r'(?:^|\d+\.\s*)([A-Z][A-Za-z\s&\'-]+(?:Hotel|Hostel|Resort|Inn|Lodge|Guesthouse|Aparthotel))',
            r'^(?:\d+\.\s*)?([A-Z][^.\n]{10,60})',  # First capitalized phrase
        ]

        for pattern in name_patterns:
            match = re.search(pattern, text, re.MULTILINE)
            if match:
                item["name"] = match.group(1).strip()
                break

        # Extract type
        type_keywords = {
            "hostel": "hostel",
            "hotel": "hotel",
            "resort": "resort",
            "guesthouse": "guesthouse",
            "airbnb": "airbnb",
            "aparthotel": "aparthotel",
            "boutique": "boutique hotel",
            "inn": "inn",
            "lodge": "lodge"
        }

        text_lower = text.lower()
        for keyword, type_name in type_keywords.items():
            if keyword in text_lower:
                item["type"] = type_name
                break

        # Extract price (look for currency symbol or code with numbers)
        price_patterns = [
            rf'{currency}\s*(\d+(?:,\d{{3}})*(?:\.\d{{2}})?)',  # USD 100
            rf'\$\s*(\d+(?:,\d{{3}})*(?:\.\d{{2}})?)',  # $100
            rf'(\d+(?:,\d{{3}})*(?:\.\d{{2}})?)\s*{currency}',  # 100 USD
            r'(?:Price|Cost|Rate)[:\s]+\$?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)',  # Price: 100
            r'\$(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:per|/)\s*night',  # $100 per night
        ]

        for pattern in price_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                price_str = match.group(1).replace(',', '')
                try:
                    item["price_per_night"] = int(float(price_str))
                    break
                except ValueError:
                    continue

        # Extract location/neighborhood
        location_patterns = [
            r'(?:Location|Neighborhood|Area)[:\s]+([A-Z][^.\n]{5,50})',
            r'(?:in|near|at)\s+([A-Z][A-Za-z\s]{5,30}(?:District|Area|Neighborhood|Quarter|Ward))',
        ]

        for pattern in location_patterns:
            match = re.search(pattern, text)
            if match:
                item["location"] = match.group(1).strip()
                break

        # Extract description (get a sentence or two)
        sentences = re.split(r'[.!?]\s+', text)
        description_parts = []
        for sentence in sentences:
            if len(sentence) > 30 and not re.match(r'^\d+\.', sentence.strip()):
                description_parts.append(sentence.strip())
                if len(description_parts) == 2:
                    break

        if description_parts:
            item["description"] = '. '.join(description_parts)
            if not item["description"].endswith('.'):
                item["description"] += '.'

        # Extract "why it fits" reasoning
        why_patterns = [
            r'(?:Why it fits|Why it\'s|Fits because|Good for)[:\s]+([^.\n]{20,200})',
            r'(?:This|It)\s+(?:is|offers|provides)[^.]{20,150}',
        ]

        for pattern in why_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                item["why_fits"] = match.group(1).strip() if match.lastindex else match.group(0).strip()
                break

        # Determine range category from text
        if "budget" in text_lower or "economical" in text_lower or "affordable" in text_lower:
            item["range_category"] = "budget"
        elif "luxury" in text_lower or "upscale" in text_lower or "5-star" in text_lower or "premium" in text_lower:
            item["range_category"] = "luxury"
        elif "mid-range" in text_lower or "mid range" in text_lower or "comfortable" in text_lower:
            item["range_category"] = "mid-range"

        # Only return if we at least got a name or type
        if "name" in item or "type" in item:
            return item

        return None

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
