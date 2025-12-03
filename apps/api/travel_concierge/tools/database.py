import os
import logging
from typing import Any, Dict
from datetime import datetime, timedelta
from supabase import create_client, Client
from google.adk.tools import ToolContext
from travel_concierge.shared_libraries import types

# Configure logging
logger = logging.getLogger(__name__)

# Initialize Supabase Client
url: str = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "")
key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

# Graceful fallback if env vars are missing (e.g. during build/test)
supabase: Client = None
if url and key:
    try:
        supabase = create_client(url, key)
    except Exception as e:
        logger.error(f"Failed to initialize Supabase client: {e}")

def save_trip_blueprint(name: str, description: str, tool_context: ToolContext, itinerary: Dict[str, Any] = None, tasks: Dict[str, Any] = None):
    """
    Saves the generated trip blueprint (Name, Description, Itinerary, and Tasks) to the database.

    Args:
        name: A catchy name for the trip.
        description: A short, engaging description of the trip.
        tool_context: The ADK tool context, used to retrieve user_id and session state.
        itinerary: Optional. The complete itinerary object (JSON/Dict). If None, tries to read from session state.
        tasks: Optional. The complete tasks object (JSON/Dict). If None, tries to read from session state.

    Returns:
        A status message with the new Trip ID.
    """
    # Try to load from state if arguments are missing
    if itinerary is None:
        itinerary = tool_context.state.get("itinerary", {})
    if tasks is None:
        tasks = tool_context.state.get("tasks", {})

    if not supabase:
        return {"status": "error", "message": "Database connection not configured."}

    # 1. Get User ID from context (assuming it was set during session init)
    # Defaulting to a placeholder if not found - strictly for dev/demo purposes
    user_id = tool_context.state.get("user_id")
    if not user_id:
        return {"status": "error", "message": "User ID not found in session state."}

    try:
        # 2. Insert Trip
        trip_data = {
            "user_id": user_id,
            "name": name,
            "description": description,
            # We can also populate start_date/end_date/destinations from the itinerary object if needed
            "start_date": itinerary.get("start_date"),
            "end_date": itinerary.get("end_date"),
            "destinations": [itinerary.get("destination")] if itinerary.get("destination") else [],
            "start_point": itinerary.get("origin")
        }

        # Remove None values to let DB defaults take over
        trip_data = {k: v for k, v in trip_data.items() if v is not None}

        logger.info(f"Inserting trip: {trip_data}")
        response = supabase.table("trips").insert(trip_data).execute()

        if not response.data:
            return {"status": "error", "message": "Failed to insert trip."}

        trip_id = response.data[0]['id']
        start_date_str = itinerary.get("start_date")
        start_date = None
        if start_date_str:
            try:
                start_date = datetime.strptime(start_date_str, "%Y-%m-%d")
            except ValueError:
                logger.warning(f"Could not parse start_date: {start_date_str}")


        # 3. Parse and Insert Itinerary Items
        itinerary_rows = []
        days = itinerary.get("days", [])

        for day in days:
            day_number = day.get("day_number")
            date_str = day.get("date")
            events = day.get("events", [])

            for index, event in enumerate(events):
                event_type = event.get("event_type", "other")

                # Map event types to DB enum if possible
                db_type = "other"
                if event_type == "flight": db_type = "transport"
                elif event_type == "hotel": db_type = "accommodation"
                elif event_type == "visit": db_type = "activity"

                row = {
                    "trip_id": trip_id,
                    "day_number": day_number,
                    "order_index": index,
                    "date": date_str,
                    "title": event.get("description", "Untitled Event"), # Mapping description -> title as primary label
                    "type": db_type,
                    # Optional fields based on event type
                    "description": _format_description(event),
                    "location": event.get("address") or event.get("arrival_airport") or event.get("hotel_name"),
                    "start_time": event.get("start_time") or event.get("departure_time") or event.get("check_in_time"),
                    "end_time": event.get("end_time") or event.get("arrival_time") or event.get("check_out_time"),
                    # Cost: needs parsing from string "$100" to int cents if needed, skipping for now or storing raw if DB allows
                }

                # Clean up None values
                row = {k: v for k, v in row.items() if v is not None}
                itinerary_rows.append(row)

        if itinerary_rows:
            logger.info(f"Inserting {len(itinerary_rows)} itinerary items")
            supabase.table("itinerary_items").insert(itinerary_rows).execute()

        # 4. Parse and Insert Tasks
        tasks_rows = []
        general_tasks = tasks.get("general_tasks", [])
        for task in general_tasks:
            due_date = None
            if start_date and task.get("due_date_offset") is not None:
                due_date = start_date - timedelta(days=task.get("due_date_offset", 0))

            row = {
                "trip_id": trip_id,
                "title": task.get("title"),
                "description": task.get("description"),
                "category": task.get("category"),
                "priority": task.get("priority"),
                "due_date": due_date.isoformat() if due_date else None,
                "is_completed": False
            }
             # Clean up None values
            row = {k: v for k, v in row.items() if v is not None}
            tasks_rows.append(row)

        if tasks_rows:
             logger.info(f"Inserting {len(tasks_rows)} general tasks")
             supabase.table("tasks").insert(tasks_rows).execute()

        # 5. Parse and Insert Destination Tasks
        dest_tasks_rows = []
        destination_tasks = tasks.get("destination_tasks", [])
        for task in destination_tasks:
            row = {
                "trip_id": trip_id,
                "destination": task.get("destination"),
                "title": task.get("title"),
                "description": task.get("description"),
                "category": task.get("category"),
                "priority": task.get("priority"),
                "is_completed": False
            }
            # Clean up None values
            row = {k: v for k, v in row.items() if v is not None}
            dest_tasks_rows.append(row)

        if dest_tasks_rows:
            logger.info(f"Inserting {len(dest_tasks_rows)} destination tasks")
            supabase.table("destination_tasks").insert(dest_tasks_rows).execute()


        return {"status": "success", "trip_id": trip_id, "message": f"Trip '{name}' saved successfully."}

    except Exception as e:
        logger.error(f"Error saving trip blueprint: {e}")
        return {"status": "error", "message": str(e)}

def _format_description(event: Dict[str, Any]) -> str:
    """Helper to create a rich description string from event details."""
    details = []
    if event.get("flight_number"):
        details.append(f"Flight: {event['flight_number']}")
    if event.get("seat_number"):
        details.append(f"Seat: {event['seat_number']}")
    if event.get("room_selection"):
        details.append(f"Room: {event['room_selection']}")
    if event.get("price"):
        details.append(f"Price: {event['price']}")

    return ", ".join(details)
