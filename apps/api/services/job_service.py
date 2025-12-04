"""Service for managing background job status."""

import uuid
from typing import Dict, Any, Optional
from datetime import datetime
from supabase import create_client, Client
import os


class JobService:
    """Service for tracking background job status in Supabase."""

    def __init__(self):
        """Initialize Supabase client."""
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

        if supabase_url and supabase_key:
            self.supabase: Optional[Client] = create_client(supabase_url, supabase_key)
        else:
            self.supabase = None
            print("Warning: Supabase not configured, using in-memory job storage")

        # In-memory fallback for development
        self._jobs: Dict[str, Dict[str, Any]] = {}

    async def create_job(self, trip_id: str, job_type: str = "itinerary_generation") -> str:
        """
        Create a new background job.

        Args:
            trip_id: Associated trip ID
            job_type: Type of job

        Returns:
            Job ID
        """
        job_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()

        job_data = {
            "job_id": job_id,
            "trip_id": trip_id,
            "job_type": job_type,
            "status": "pending",
            "progress": 0,
            "message": "Job created",
            "result": None,
            "error": None,
            "created_at": now,
            "updated_at": now
        }

        if self.supabase:
            try:
                # Note: You need to create a 'jobs' table in Supabase
                # For now, storing in memory
                pass
            except Exception as e:
                print(f"Error creating job in Supabase: {e}")

        # Store in memory
        self._jobs[job_id] = job_data

        return job_id

    async def update_job_status(
        self,
        job_id: str,
        status: str,
        progress: int = 0,
        message: Optional[str] = None,
        result: Optional[Dict[str, Any]] = None,
        error: Optional[str] = None
    ) -> None:
        """
        Update job status.

        Args:
            job_id: Job ID
            status: New status (pending, processing, completed, failed)
            progress: Progress percentage (0-100)
            message: Status message
            result: Job result data
            error: Error message if failed
        """
        if job_id not in self._jobs:
            print(f"Warning: Job {job_id} not found")
            return

        now = datetime.utcnow().isoformat()

        self._jobs[job_id].update({
            "status": status,
            "progress": progress,
            "message": message,
            "result": result,
            "error": error,
            "updated_at": now
        })

        if self.supabase:
            try:
                # Update in Supabase when table is ready
                pass
            except Exception as e:
                print(f"Error updating job in Supabase: {e}")

    async def get_job_status(self, job_id: str) -> Optional[Dict[str, Any]]:
        """
        Get job status.

        Args:
            job_id: Job ID

        Returns:
            Job data or None if not found
        """
        if job_id in self._jobs:
            return self._jobs[job_id]

        if self.supabase:
            try:
                # Query from Supabase when table is ready
                pass
            except Exception as e:
                print(f"Error getting job from Supabase: {e}")

        return None

    async def save_itinerary_items(
        self,
        trip_id: str,
        items: list[Dict[str, Any]]
    ) -> None:
        """
        Save itinerary items to Supabase.

        Args:
            trip_id: Trip ID
            items: List of itinerary items
        """
        if not self.supabase:
            print("Warning: Supabase not configured, cannot save itinerary items")
            return

        try:
            # Prepare items for insertion
            db_items = []
            for item in items:
                db_item = {
                    "trip_id": trip_id,
                    "day_number": item.get("day_number"),
                    "date": item.get("date"),
                    "start_time": item.get("start_time"),
                    "end_time": item.get("end_time"),
                    "title": item.get("title"),
                    "description": item.get("description"),
                    "location": item.get("location"),
                    "type": item.get("type"),
                    "cost": item.get("cost", 0),
                    "order_index": item.get("order_index", 0)
                }
                db_items.append(db_item)

            # Insert into Supabase
            result = self.supabase.table("itinerary_items").insert(db_items).execute()
            print(f"Saved {len(db_items)} itinerary items for trip {trip_id}")

        except Exception as e:
            print(f"Error saving itinerary items: {e}")
            raise

    async def save_tasks(
        self,
        trip_id: str,
        tasks: list[Dict[str, Any]]
    ) -> None:
        """
        Save tasks to Supabase.

        Args:
            trip_id: Trip ID
            tasks: List of task dictionaries
        """
        if not self.supabase:
            print("Warning: Supabase not configured, cannot save tasks")
            return

        try:
            # Prepare tasks for insertion
            db_tasks = []
            for task in tasks:
                db_task = {
                    "trip_id": trip_id,
                    "title": task.get("title"),
                    "description": task.get("description"),
                    "category": task.get("category", "general"),
                    "priority": task.get("priority", "medium"),
                    "due_date": None,  # Set to None - relative dates like "2 weeks before" can't be stored as timestamp
                    "is_completed": task.get("completed", False)  # Database column is is_completed
                }
                db_tasks.append(db_task)

            # Insert into Supabase
            result = self.supabase.table("tasks").insert(db_tasks).execute()
            print(f"Saved {len(db_tasks)} tasks for trip {trip_id}")

        except Exception as e:
            print(f"Error saving tasks: {e}")
            raise


# Singleton instance
_service_instance = None


def get_job_service() -> JobService:
    """Get or create the singleton job service instance."""
    global _service_instance
    if _service_instance is None:
        _service_instance = JobService()
    return _service_instance
