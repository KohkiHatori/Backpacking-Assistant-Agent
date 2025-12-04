"""Sub-agent for researching vaccine requirements and creating vaccination tasks."""

import os
import json
import re
from typing import List, Dict, Any, Optional
from perplexity import Perplexity


class VaccineAgent:
    """
    Sub-agent responsible for researching vaccine requirements for destinations
    and creating appropriate vaccination tasks.

    Uses Perplexity AI to research up-to-date vaccine recommendations from
    reliable sources like CDC and WHO.
    """

    def __init__(self):
        """Initialize the vaccine agent with Perplexity client."""
        self.api_key = os.getenv("PERPLEXITY_API_KEY")
        if self.api_key:
            self.client = Perplexity(api_key=self.api_key)
        else:
            self.client = None
            print("[VACCINE AGENT] ⚠️  Warning: PERPLEXITY_API_KEY not set in environment")

    def generate_vaccine_tasks(
        self,
        trip_data: Dict[str, Any],
        user_citizenship: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Generate vaccine-related tasks for all destinations in the trip.

        Args:
            trip_data: Dictionary containing trip information (destinations, dates, etc.)
            user_citizenship: User's citizenship (optional, for context)

        Returns:
            List of task dictionaries for vaccine requirements
        """
        print("\n" + "=" * 80)
        print("[VACCINE AGENT] Starting vaccine task generation")
        print("=" * 80)

        if not self.client:
            print("[VACCINE AGENT] ❌ Perplexity client not initialized, skipping")
            return []

        destinations = trip_data.get("destinations", [])
        start_date = trip_data.get("start_date", "")

        if not destinations:
            print("[VACCINE AGENT] ⚠️  No destinations provided")
            return []

        print(f"[VACCINE AGENT] Destinations: {destinations}")
        print(f"[VACCINE AGENT] Start date: {start_date}")
        if user_citizenship:
            print(f"[VACCINE AGENT] User citizenship: {user_citizenship}")

        # Research vaccine requirements
        print(f"\n[VACCINE AGENT] 🔍 Researching vaccine requirements via Perplexity...")
        vaccine_info = self._research_vaccines(destinations, user_citizenship, start_date)

        if not vaccine_info:
            print("[VACCINE AGENT] ⚠️  No vaccine information retrieved")
            return []

        # Parse vaccine information and create tasks
        print(f"\n[VACCINE AGENT] 📋 Parsing vaccine recommendations...")
        tasks = self._create_tasks_from_research(vaccine_info, destinations)

        print(f"\n[VACCINE AGENT] ✓ Total vaccine tasks generated: {len(tasks)}")
        print("=" * 80 + "\n")

        return tasks

    def _research_vaccines(
        self,
        destinations: List[str],
        user_citizenship: Optional[str],
        start_date: str
    ) -> Optional[str]:
        """
        Use Perplexity AI to research vaccine requirements.

        Args:
            destinations: List of destination names
            user_citizenship: User's citizenship
            start_date: Trip start date

        Returns:
            Research results as text or None if API fails
        """
        # Build the research query
        destinations_str = ", ".join(destinations)

        query = f"""What vaccines and immunizations are required or recommended for travelers visiting {destinations_str}?

Please check reliable sources like:
- CDC Travelers' Health (USA)
- WHO International Travel and Health
- Official government travel health advisories

For each vaccine, specify:
1. Vaccine name
2. Whether it's REQUIRED or RECOMMENDED
3. Which destination(s) it applies to
4. Any important timing or dosage notes

Focus on practical, actionable advice for a traveler departing around {start_date if start_date else 'soon'}."""

        if user_citizenship:
            query += f"\n\nTraveler is from {user_citizenship}."

        try:
            print(f"[VACCINE AGENT]   📡 Querying Perplexity (model: sonar)...")

            completion = self.client.chat.completions.create(
                model="sonar",
                messages=[
                    {"role": "user", "content": query}
                ]
            )

            response_text = completion.choices[0].message.content

            # Log citations if available
            if hasattr(completion, 'citations') and completion.citations:
                print(f"[VACCINE AGENT]   ✓ Retrieved {len(completion.citations)} citations")
                for i, citation in enumerate(completion.citations[:3], 1):
                    print(f"[VACCINE AGENT]     {i}. {citation}")

            print(f"[VACCINE AGENT]   ✓ Response length: {len(response_text)} characters")

            return response_text

        except Exception as e:
            print(f"[VACCINE AGENT]   ❌ Error calling Perplexity API: {e}")
            import traceback
            traceback.print_exc()
            return None

    def _create_tasks_from_research(
        self,
        research_text: str,
        destinations: List[str]
    ) -> List[Dict[str, Any]]:
        """
        Parse Perplexity research results and create vaccine tasks.

        Args:
            research_text: Research results from Perplexity
            destinations: List of destinations

        Returns:
            List of vaccine task dictionaries
        """
        tasks = []

        # Common vaccines to look for (case-insensitive)
        vaccine_keywords = [
            "Yellow Fever",
            "Typhoid",
            "Hepatitis A",
            "Hepatitis B",
            "Rabies",
            "Japanese Encephalitis",
            "Malaria",  # Note: malaria is prevention, not vaccine
            "Tetanus",
            "Diphtheria",
            "Measles",
            "Mumps",
            "Rubella",
            "Polio",
            "COVID-19",
            "Cholera",
            "Meningococcal",
            "Tuberculosis",
            "Influenza"
        ]

        # Track which vaccines we've found
        found_vaccines = {}

        # Search for each vaccine in the research text
        research_lower = research_text.lower()

        for vaccine in vaccine_keywords:
            vaccine_lower = vaccine.lower()

            # Check if this vaccine is mentioned
            if vaccine_lower in research_lower:
                # Determine if it's required or recommended
                is_required = self._is_vaccine_required(research_text, vaccine)

                # Extract relevant context about this vaccine
                context = self._extract_vaccine_context(research_text, vaccine)

                # Determine which destinations need this vaccine
                applicable_destinations = self._find_applicable_destinations(
                    research_text,
                    vaccine,
                    destinations
                )

                found_vaccines[vaccine] = {
                    "required": is_required,
                    "context": context,
                    "destinations": applicable_destinations
                }

        # Create tasks only for required vaccines
        for vaccine, info in found_vaccines.items():
            if info["required"]:  # Only add required vaccines
                task = self._create_vaccine_task(vaccine, info)
                tasks.append(task)
            else:
                print(f"[VACCINE AGENT]   ⏭️  Skipping {vaccine} (recommended, not required)")

        # If no required vaccines found, no tasks needed
        if not tasks:
            print("[VACCINE AGENT]   ℹ️  No required vaccines found for these destinations")

        return tasks

    def _is_vaccine_required(self, text: str, vaccine: str) -> bool:
        """Check if vaccine is required vs recommended."""
        # Look for required/mandatory near the vaccine name
        vaccine_lower = vaccine.lower()
        text_lower = text.lower()

        # Find all occurrences of the vaccine
        pattern = re.compile(rf'\b{re.escape(vaccine_lower)}\b.{{0,200}}', re.IGNORECASE)
        matches = pattern.findall(text_lower)

        for match in matches:
            if any(word in match for word in ['required', 'mandatory', 'must', 'compulsory', 'obligatory']):
                return True

        return False

    def _extract_vaccine_context(self, text: str, vaccine: str) -> str:
        """Extract relevant context about a vaccine from the research."""
        vaccine_lower = vaccine.lower()
        text_lines = text.split('\n')

        context_lines = []
        for i, line in enumerate(text_lines):
            if vaccine_lower in line.lower():
                # Get this line and the next 2 lines for context
                context_lines.extend(text_lines[i:min(i+3, len(text_lines))])

        context = ' '.join(context_lines)
        # Limit context length
        if len(context) > 300:
            context = context[:300] + "..."

        return context if context else f"Vaccine mentioned for travel to destination(s)."

    def _find_applicable_destinations(
        self,
        text: str,
        vaccine: str,
        all_destinations: List[str]
    ) -> List[str]:
        """Determine which destinations this vaccine applies to."""
        applicable = []
        vaccine_lower = vaccine.lower()
        text_lower = text.lower()

        # Find sections mentioning this vaccine
        for destination in all_destinations:
            # Extract country name from destination (after last comma)
            dest_parts = destination.split(',')
            dest_name = dest_parts[-1].strip() if dest_parts else destination

            # Check if vaccine and destination appear near each other in text
            # Look within 500 characters
            dest_lower = dest_name.lower()

            # Find vaccine mentions
            vaccine_positions = [m.start() for m in re.finditer(rf'\b{re.escape(vaccine_lower)}\b', text_lower)]

            for pos in vaccine_positions:
                # Check if destination appears within 500 chars before or after
                text_window = text_lower[max(0, pos-500):min(len(text_lower), pos+500)]
                if dest_lower in text_window:
                    if destination not in applicable:
                        applicable.append(destination)
                    break

        # If we couldn't determine specific destinations, assume all
        return applicable if applicable else all_destinations

    def _create_vaccine_task(self, vaccine: str, info: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a task dictionary for a vaccine.

        Args:
            vaccine: Vaccine name
            info: Information about the vaccine (required, context, destinations)

        Returns:
            Task dictionary
        """
        is_required = info["required"]
        destinations = info["destinations"]
        context = info["context"]

        # Build destination string
        if len(destinations) == 1:
            dest_str = destinations[0]
        elif len(destinations) == 2:
            dest_str = f"{destinations[0]} and {destinations[1]}"
        elif len(destinations) > 2:
            dest_str = ", ".join(destinations[:-1]) + f", and {destinations[-1]}"
        else:
            dest_str = "your destinations"

        # Build task title (only for required vaccines now)
        title = f"Get required {vaccine} vaccine"

        # Build description
        description = f"{vaccine} vaccine is required for travel to {dest_str}. "
        description += "Consult your doctor or a travel clinic. "

        # Add timing recommendation
        if any(keyword in vaccine.lower() for keyword in ['yellow fever', 'japanese encephalitis']):
            description += "Recommended: Get vaccinated at least 4-6 weeks before travel. "
        else:
            description += "Recommended: Get vaccinated at least 2-4 weeks before travel. "

        # Add context if available
        if context and len(context) < 200:
            description += f"\n\nNote: {context}"

        # All tasks are high priority since we only create tasks for required vaccines
        priority = "high"

        return {
            "title": title,
            "description": description,
            "category": "health",
            "priority": priority,
            "completed": False
        }


# Singleton instance
_vaccine_agent_instance = None


def get_vaccine_agent() -> VaccineAgent:
    """Get or create the singleton vaccine agent instance."""
    global _vaccine_agent_instance
    if _vaccine_agent_instance is None:
        _vaccine_agent_instance = VaccineAgent()
    return _vaccine_agent_instance
