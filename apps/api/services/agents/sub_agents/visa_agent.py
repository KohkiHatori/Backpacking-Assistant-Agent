"""Sub-agent for checking visa requirements and creating visa-related tasks."""

import requests
import os
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from functools import lru_cache


# Comprehensive mapping of countries and major cities to ISO 3166-1 alpha-2 codes
LOCATION_TO_COUNTRY_CODE = {
    # Major countries
    "usa": "US", "united states": "US", "america": "US",
    "uk": "GB", "united kingdom": "GB", "england": "GB", "britain": "GB", "scotland": "GB", "wales": "GB",
    "canada": "CA",
    "australia": "AU",
    "new zealand": "NZ",
    "japan": "JP",
    "china": "CN",
    "south korea": "KR", "korea": "KR",
    "singapore": "SG",
    "thailand": "TH",
    "vietnam": "VN",
    "indonesia": "ID",
    "malaysia": "MY",
    "philippines": "PH",
    "india": "IN",
    "france": "FR",
    "germany": "DE",
    "italy": "IT",
    "spain": "ES",
    "portugal": "PT",
    "netherlands": "NL", "holland": "NL",
    "belgium": "BE",
    "switzerland": "CH",
    "austria": "AT",
    "greece": "GR",
    "turkey": "TR",
    "egypt": "EG",
    "south africa": "ZA",
    "morocco": "MA",
    "brazil": "BR",
    "argentina": "AR",
    "chile": "CL",
    "peru": "PE",
    "mexico": "MX",
    "colombia": "CO",
    "costa rica": "CR",
    "iceland": "IS",
    "norway": "NO",
    "sweden": "SE",
    "denmark": "DK",
    "finland": "FI",
    "poland": "PL",
    "czech republic": "CZ", "czechia": "CZ",
    "hungary": "HU",
    "croatia": "HR",
    "ireland": "IE",
    "russia": "RU",
    "uae": "AE", "united arab emirates": "AE", "dubai": "AE", "abu dhabi": "AE",
    "israel": "IL",
    "saudi arabia": "SA",
    "qatar": "QA",
    "hong kong": "HK",
    "taiwan": "TW",
    "cambodia": "KH",
    "laos": "LA",
    "myanmar": "MM", "burma": "MM",
    "nepal": "NP",
    "sri lanka": "LK",
    "bangladesh": "BD",
    "pakistan": "PK",
    "maldives": "MV",

    # Major cities mapped to their countries
    # USA cities
    "new york": "US", "los angeles": "US", "chicago": "US", "san francisco": "US",
    "seattle": "US", "boston": "US", "miami": "US", "las vegas": "US", "orlando": "US",
    "washington": "US", "washington dc": "US", "atlanta": "US", "houston": "US",
    "philadelphia": "US", "phoenix": "US", "san diego": "US", "denver": "US",

    # Japan cities
    "tokyo": "JP", "osaka": "JP", "kyoto": "JP", "hiroshima": "JP", "nagoya": "JP",
    "fukuoka": "JP", "sapporo": "JP", "yokohama": "JP", "kobe": "JP", "nara": "JP",

    # China cities
    "beijing": "CN", "shanghai": "CN", "guangzhou": "CN", "shenzhen": "CN",
    "chengdu": "CN", "xi'an": "CN", "xian": "CN", "hangzhou": "CN", "suzhou": "CN",

    # Europe cities
    "london": "GB", "paris": "FR", "berlin": "DE", "rome": "IT", "madrid": "ES",
    "barcelona": "ES", "amsterdam": "NL", "brussels": "BE", "vienna": "AT",
    "prague": "CZ", "budapest": "HU", "lisbon": "PT", "athens": "GR", "dublin": "IE",
    "edinburgh": "GB", "munich": "DE", "venice": "IT", "florence": "IT", "milan": "IT",
    "stockholm": "SE", "copenhagen": "DK", "oslo": "NO", "helsinki": "FI",
    "zurich": "CH", "geneva": "CH", "warsaw": "PL", "reykjavik": "IS",

    # Southeast Asia cities
    "bangkok": "TH", "singapore": "SG", "kuala lumpur": "MY", "jakarta": "ID",
    "bali": "ID", "manila": "PH", "hanoi": "VN", "ho chi minh": "VN", "saigon": "VN",
    "phnom penh": "KH", "siem reap": "KH", "vientiane": "LA", "yangon": "MM",
    "phuket": "TH", "chiang mai": "TH", "penang": "MY",

    # Middle East cities
    "dubai": "AE", "abu dhabi": "AE", "tel aviv": "IL", "jerusalem": "IL",
    "istanbul": "TR", "riyadh": "SA", "doha": "QA",

    # Oceania cities
    "sydney": "AU", "melbourne": "AU", "brisbane": "AU", "perth": "AU",
    "auckland": "NZ", "wellington": "NZ", "queenstown": "NZ",

    # South Asia cities
    "mumbai": "IN", "delhi": "IN", "bangalore": "IN", "kolkata": "IN",
    "kathmandu": "NP", "colombo": "LK", "dhaka": "BD", "karachi": "PK", "male": "MV",

    # Americas cities
    "toronto": "CA", "vancouver": "CA", "montreal": "CA",
    "mexico city": "MX", "cancun": "MX",
    "buenos aires": "AR", "rio de janeiro": "BR", "sao paulo": "BR",
    "lima": "PE", "santiago": "CL", "bogota": "CO", "san jose": "CR",

    # Africa cities
    "cairo": "EG", "cape town": "ZA", "johannesburg": "ZA", "marrakech": "MA",
    "casablanca": "MA", "nairobi": "KE", "lagos": "NG",
}


class VisaAgent:
    """
    Sub-agent responsible for checking visa requirements for destinations
    and creating appropriate tasks based on visa rules.

    Uses restcountries.com API for dynamic country code lookup with LRU caching
    to minimize API calls. Falls back to static mapping if API is unavailable.
    """

    def __init__(self):
        """Initialize the visa agent with API credentials."""
        self.api_key = os.getenv("RAPIDAPI_SECRET")
        self.api_url = "https://visa-requirement.p.rapidapi.com/v2/visa/check"
        self.restcountries_url = "https://restcountries.com/v3.1"
        # Cache for country code lookups (country_name -> code)
        self._country_code_cache: Dict[str, Optional[str]] = {}

    def generate_visa_tasks(
        self,
        trip_data: Dict[str, Any],
        user_citizenship: str
    ) -> List[Dict[str, Any]]:
        """
        Generate visa-related tasks for all destinations in the trip.

        Args:
            trip_data: Dictionary containing trip information (destinations, dates, etc.)
            user_citizenship: User's citizenship/passport country (full name, will be mapped to code)

        Returns:
            List of task dictionaries for visa requirements
        """
        print("\n" + "=" * 80)
        print("[VISA AGENT] Starting visa task generation")
        print("=" * 80)

        tasks = []
        destinations = trip_data.get("destinations", [])

        print(f"[VISA AGENT] User citizenship: {user_citizenship}")
        print(f"[VISA AGENT] Destinations: {destinations}")
        print(f"[VISA AGENT] Total destinations: {len(destinations)}")

        # Map user citizenship to country code
        print(f"\n[VISA AGENT] Mapping citizenship '{user_citizenship}' to country code...")
        passport_code = self._get_country_code(user_citizenship)

        if not passport_code:
            print(f"[VISA AGENT] ❌ ERROR: Could not map citizenship '{user_citizenship}' to country code")
            print(f"[VISA AGENT] Falling back to generic visa tasks")
            return self._get_fallback_visa_tasks(destinations)

        print(f"[VISA AGENT] ✓ Passport country code: {passport_code}")

        # Process each destination
        seen_countries = set()  # Track countries we've already checked

        print(f"\n[VISA AGENT] Processing destinations...")
        print("-" * 80)

        for i, destination in enumerate(destinations, 1):
            print(f"\n[VISA AGENT] Destination {i}/{len(destinations)}: {destination}")

            destination_code = self._get_country_code(destination)

            if not destination_code:
                print(f"[VISA AGENT]   ⚠️  Could not map to country code, skipping")
                continue

            print(f"[VISA AGENT]   ✓ Country code: {destination_code}")

            # Skip if we've already checked this country
            if destination_code in seen_countries:
                print(f"[VISA AGENT]   ⏭️  Already checked {destination_code}, skipping duplicate")
                continue

            seen_countries.add(destination_code)

            # Don't check visa for same country
            if destination_code == passport_code:
                print(f"[VISA AGENT]   ⏭️  Same as passport country, skipping")
                continue

            # Check visa requirements
            print(f"[VISA AGENT]   🔍 Checking visa requirements: {passport_code} → {destination_code}")
            visa_info = self._check_visa_requirements(passport_code, destination_code)

            if visa_info:
                # Extract visa rule info for logging
                visa_rules = visa_info.get("visa_rules", {})
                primary_rule = visa_rules.get("primary_rule", {})
                rule_name = primary_rule.get("name", "Unknown")
                duration = primary_rule.get("duration", "N/A")

                print(f"[VISA AGENT]   ✓ Visa info retrieved: {rule_name} ({duration})")

                # Create tasks based on visa requirements
                destination_tasks = self._create_tasks_from_visa_info(
                    destination,
                    destination_code,
                    visa_info,
                    trip_data
                )
                print(f"[VISA AGENT]   ✓ Created {len(destination_tasks)} task(s)")
                tasks.extend(destination_tasks)
            else:
                # Fallback if API fails
                print(f"[VISA AGENT]   ⚠️  API failed, creating fallback task")
                tasks.append(self._create_fallback_visa_task(destination))

        print("\n" + "-" * 80)
        print(f"[VISA AGENT] ✓ Total visa tasks generated: {len(tasks)}")
        print("=" * 80 + "\n")

        return tasks

    def _check_visa_requirements(
        self,
        passport_code: str,
        destination_code: str
    ) -> Optional[Dict[str, Any]]:
        """
        Check visa requirements using the RapidAPI visa requirement API.

        Args:
            passport_code: ISO 3166-1 alpha-2 code for passport country
            destination_code: ISO 3166-1 alpha-2 code for destination country

        Returns:
            Dictionary with visa information or None if API call fails
        """
        if not self.api_key:
            print("[VISA AGENT] ⚠️  Warning: RAPIDAPI_SECRET not set in environment")
            return None

        try:
            # Note: This API blocks Python's default user-agent, so we use curl's
            headers = {
                "Content-Type": "application/json",
                "X-RapidAPI-Key": self.api_key,
                "X-RapidAPI-Host": "visa-requirement.p.rapidapi.com",
                "User-Agent": "curl/8.7.1"
            }

            payload = {
                "passport": passport_code,
                "destination": destination_code
            }

            print(f"[VISA AGENT]   📡 API Request: {self.api_url}")
            print(f"[VISA AGENT]   📦 Payload: {payload}")
            print(f"[VISA AGENT]   🔑 API Key: {self.api_key[:10]}...{self.api_key[-4:]} (len: {len(self.api_key)})")
            print(f"[VISA AGENT]   📋 Headers being sent: {list(headers.keys())}")

            response = requests.post(
                self.api_url,
                json=payload,
                headers=headers,
                timeout=10
            )

            print(f"[VISA AGENT]   📊 Response Status: {response.status_code}")
            print(f"[VISA AGENT]   📊 Response Content-Type: {response.headers.get('content-type', 'N/A')}")

            if response.status_code == 403:
                print(f"[VISA AGENT]   ❌ 403 Forbidden - Response: {response.text[:200]}")

            response.raise_for_status()
            data = response.json()

            return data.get("data")

        except requests.exceptions.HTTPError as e:
            print(f"[VISA AGENT]   ❌ HTTP Error for {passport_code} -> {destination_code}: {e}")
            print(f"[VISA AGENT]   Response Content-Type: {response.headers.get('content-type', 'N/A')}")
            print(f"[VISA AGENT]   Response body: {response.text[:500] if 'response' in locals() else 'N/A'}")
            return None
        except requests.exceptions.RequestException as e:
            print(f"[VISA AGENT]   ❌ Request Error for {passport_code} -> {destination_code}: {e}")
            return None
        except Exception as e:
            print(f"[VISA AGENT]   ❌ Unexpected error checking visa requirements: {e}")
            import traceback
            traceback.print_exc()
            return None

    def _create_tasks_from_visa_info(
        self,
        destination_name: str,
        destination_code: str,
        visa_info: Dict[str, Any],
        trip_data: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Create task objects based on visa API response.

        Args:
            destination_name: Human-readable destination name
            destination_code: ISO country code for destination
            visa_info: Visa information from API
            trip_data: Trip data for context (dates, etc.)

        Returns:
            List of task dictionaries
        """
        tasks = []

        destination_info = visa_info.get("destination", {})
        visa_rules = visa_info.get("visa_rules", {})
        primary_rule = visa_rules.get("primary_rule", {})
        secondary_rule = visa_rules.get("secondary_rule", {})
        mandatory_registration = visa_info.get("mandatory_registration", {})

        rule_name = primary_rule.get("name", "").lower()
        duration = primary_rule.get("duration", "")
        passport_validity = destination_info.get("passport_validity", "")

        # Task 1: Visa or Passport validity check
        if "visa-free" in rule_name or "visa free" in rule_name:
            # Visa-free entry - create passport validity task
            task = {
                "title": f"Check passport validity for {destination_name}",
                "description": (
                    f"Ensure your passport is valid for entry to {destination_name}. "
                    f"Required validity: {passport_validity}. "
                    f"Entry allowed for: {duration}. "
                    f"Recommended: Verify 6 weeks before trip."
                ),
                "category": "documentation",
                "priority": "high",
                "completed": False
            }
            tasks.append(task)

        elif "visa required" in rule_name:
            # Full visa required - high priority task
            link = primary_rule.get("link", "")
            embassy_url = destination_info.get("embassy_url", "")

            description = (
                f"Apply for visa to {destination_name}. "
                f"Visa type: {primary_rule.get('name', 'Required visa')}. "
            )

            if duration:
                description += f"Duration: {duration}. "

            if passport_validity:
                description += f"Passport validity required: {passport_validity}. "

            if link:
                description += f"Application link: {link}. "
            elif embassy_url:
                description += f"Embassy info: {embassy_url}. "

            description += "Recommended: Apply 6-8 weeks before trip."

            task = {
                "title": f"Apply for {destination_name} visa",
                "description": description,
                "category": "visa",
                "priority": "high",
                "completed": False
            }
            tasks.append(task)

        elif "visa on arrival" in rule_name or "e-visa" in rule_name or "evisa" in rule_name:
            # Visa on arrival or e-visa - medium priority
            link = primary_rule.get("link", "")

            description = (
                f"Obtain {primary_rule.get('name', 'visa')} for {destination_name}. "
            )

            if duration:
                description += f"Duration: {duration}. "

            if passport_validity:
                description += f"Passport validity required: {passport_validity}. "

            if link:
                description += f"More info: {link}. "

            # Check if secondary rule exists (e.g., eVisa alternative)
            if secondary_rule and secondary_rule.get("name"):
                sec_name = secondary_rule.get("name", "")
                sec_duration = secondary_rule.get("duration", "")
                sec_link = secondary_rule.get("link", "")
                description += f"Alternative: {sec_name}"
                if sec_duration:
                    description += f" ({sec_duration})"
                if sec_link:
                    description += f" - {sec_link}"
                description += ". "

            description += "Recommended: Check requirements 3-4 weeks before trip."

            task = {
                "title": f"Get {primary_rule.get('name', 'visa')} for {destination_name}",
                "description": description,
                "category": "visa",
                "priority": "high",
                "completed": False
            }
            tasks.append(task)

        # Task 2: Mandatory registration (e.g., e-Arrival)
        if mandatory_registration and mandatory_registration.get("name"):
            reg_name = mandatory_registration.get("name", "registration")
            reg_link = mandatory_registration.get("link", "")

            description = (
                f"Complete {reg_name} for {destination_name}. "
                f"This is mandatory before arrival. "
            )

            if reg_link:
                description += f"Registration link: {reg_link}. "

            description += "Recommended: Complete 1-2 weeks before trip."

            task = {
                "title": f"Complete {reg_name} for {destination_name}",
                "description": description,
                "category": "documentation",
                "priority": "high",
                "completed": False
            }
            tasks.append(task)

        return tasks

    def _extract_country_from_destination(self, destination: str) -> str:
        """
        Extract country name from destination string.

        Since destinations from Google Maps API are formatted as "City, Region, Country",
        we extract the part after the last comma.

        Args:
            destination: Full destination string (e.g., "Tokyo, Japan" or "Paris, Île-de-France, France")

        Returns:
            Country name (e.g., "Japan" or "France")
        """
        if not destination:
            return destination

        # Split by comma and get the last part (country)
        parts = [part.strip() for part in destination.split(',')]
        if len(parts) > 0:
            return parts[-1]  # Last part is always the country

        return destination

    def _get_country_code_from_api(self, country_name: str) -> Optional[str]:
        """
        Get country code from restcountries.com API.

        Args:
            country_name: Full country name

        Returns:
            ISO 3166-1 alpha-2 country code or None if not found
        """
        try:
            # Query restcountries API by country name
            response = requests.get(
                f"{self.restcountries_url}/name/{country_name}",
                params={"fullText": "true"},  # Exact match
                timeout=5
            )

            if response.status_code == 200:
                data = response.json()
                if data and len(data) > 0:
                    # Get the cca2 (alpha-2 code) from first result
                    code = data[0].get("cca2")
                    if code:
                        print(f"[VISA] Mapped '{country_name}' to '{code}' via API")
                        return code

            # Try partial match if exact match fails
            response = requests.get(
                f"{self.restcountries_url}/name/{country_name}",
                timeout=5
            )

            if response.status_code == 200:
                data = response.json()
                if data and len(data) > 0:
                    code = data[0].get("cca2")
                    if code:
                        print(f"[VISA] Mapped '{country_name}' to '{code}' via API (partial match)")
                        return code

            return None

        except requests.exceptions.RequestException as e:
            print(f"[VISA] Error calling restcountries API for '{country_name}': {e}")
            return None
        except Exception as e:
            print(f"[VISA] Unexpected error in restcountries lookup: {e}")
            return None

    def _get_country_code(self, location: str) -> Optional[str]:
        """
        Map a location name to ISO 3166-1 alpha-2 country code.

        Strategy:
        1. Extract country name from destination string (after last comma)
        2. Check cache for previously looked up country
        3. Try restcountries.com API for dynamic lookup
        4. Fall back to static mapping for offline/API failure scenarios
        5. Cache the result for future lookups

        Args:
            location: Country name or full destination string

        Returns:
            Two-letter country code or None if not found
        """
        if not location:
            return None

        # Normalize the input
        location_stripped = location.strip()

        # Check if it's already a 2-letter code
        if len(location_stripped) == 2 and location_stripped.isalpha():
            return location_stripped.upper()

        # Extract country name from destination (e.g., "Tokyo, Japan" -> "Japan")
        country_name = self._extract_country_from_destination(location_stripped)
        country_name_lower = country_name.lower().strip()

        # Check cache first
        if country_name_lower in self._country_code_cache:
            cached_code = self._country_code_cache[country_name_lower]
            if cached_code:
                print(f"[VISA] Using cached code for '{country_name}': {cached_code}")
            return cached_code

        # Try restcountries.com API for dynamic lookup
        code = self._get_country_code_from_api(country_name)

        # Fall back to static mapping if API fails
        if not code:
            code = LOCATION_TO_COUNTRY_CODE.get(country_name_lower)
            if code:
                print(f"[VISA] Using static mapping for '{country_name}': {code}")

        # Cache the result (even if None, to avoid repeated failed lookups)
        self._country_code_cache[country_name_lower] = code

        if not code:
            print(f"[VISA] Could not map '{country_name}' to country code")

        return code

    def _create_fallback_visa_task(self, destination: str) -> Dict[str, Any]:
        """
        Create a generic fallback visa task when API fails.

        Args:
            destination: Destination name

        Returns:
            Generic visa task dictionary
        """
        return {
            "title": f"Research visa requirements for {destination}",
            "description": (
                f"Check if visa is required for {destination} and apply if necessary. "
                f"Visit official embassy website or government travel advisory. "
                f"Recommended: 6 weeks before trip."
            ),
            "category": "visa",
            "priority": "high",
            "completed": False
        }

    def _get_fallback_visa_tasks(self, destinations: List[str]) -> List[Dict[str, Any]]:
        """
        Generate fallback visa tasks when citizenship mapping fails.

        Args:
            destinations: List of destination names

        Returns:
            List of generic visa task dictionaries
        """
        tasks = []
        for destination in destinations:
            tasks.append(self._create_fallback_visa_task(destination))
        return tasks


# Singleton instance
_visa_agent_instance = None


def get_visa_agent() -> VisaAgent:
    """Get or create the singleton visa agent instance."""
    global _visa_agent_instance
    if _visa_agent_instance is None:
        _visa_agent_instance = VisaAgent()
    return _visa_agent_instance
