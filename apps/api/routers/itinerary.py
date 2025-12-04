"""API routes for itinerary generation and modification."""

from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any
from schemas.trip_schemas import (
    ItineraryGenerationRequest,
    ItineraryModificationRequest,
    JobStatusResponse
)
from services.job_service import get_job_service, JobService
from services.agents.sub_agents.itinerary_agent import get_itinerary_agent
from supabase import create_client, Client
import os
import asyncio
import threading

router = APIRouter(prefix="/itinerary", tags=["itinerary"])


def _run_async_in_thread(coro):
    """
    Run an async coroutine in a new thread with its own event loop.
    This ensures it doesn't block the main request/response cycle.

    Args:
        coro: The coroutine to run
    """
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        loop.run_until_complete(coro)
    finally:
        loop.close()


def get_supabase() -> Client:
    """Get Supabase client."""
    return create_client(
        os.getenv("SUPABASE_URL"),
        os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    )


async def _generate_itinerary_async(
    job_id: str,
    trip_id: str,
    job_service: JobService
):
    """
    Async coroutine to generate itinerary progressively (day-by-day).

    Args:
        job_id: Job ID
        trip_id: Trip ID
        job_service: Job service instance
    """
    from datetime import datetime, timedelta

    try:
        # Update status to processing
        await job_service.update_job_status(
            job_id,
            status="processing",
            progress=5,
            message="Fetching trip details"
        )

        # Get trip details from Supabase
        supabase = get_supabase()
        trip_response = supabase.table("trips").select("*").eq("id", trip_id).single().execute()

        if not trip_response.data:
            raise ValueError(f"Trip {trip_id} not found")

        trip_data = trip_response.data

        # Calculate number of days
        start_date = datetime.fromisoformat(trip_data["start_date"])
        end_date = datetime.fromisoformat(trip_data["end_date"])
        num_days = (end_date - start_date).days + 1

        print(f"[ITINERARY] Generating {num_days} days for trip {trip_id}")

        # Generate day-by-day
        agent = get_itinerary_agent()
        previous_days_summary = ""

        for day in range(1, num_days + 1):
            # Update progress BEFORE generating
            progress_before = 10 + (day - 1) * (80 // num_days)
            await job_service.update_job_status(
                job_id,
                status="processing",
                progress=progress_before,
                message=f"Generating Day {day} of {num_days}"
            )

            print(f"[ITINERARY] Generating Day {day}/{num_days} (Progress: {progress_before}%)")

            # Generate single day
            day_items = agent.generate_single_day(trip_data, day, previous_days_summary)

            # Save immediately to database
            await job_service.save_itinerary_items(trip_id, day_items)
            print(f"[ITINERARY] Saved {len(day_items)} items for Day {day}")

            # Update progress AFTER saving (day complete)
            progress_after = 10 + day * (80 // num_days)
            await job_service.update_job_status(
                job_id,
                status="processing",
                progress=progress_after,
                message=f"Day {day} of {num_days} complete ✓"
            )
            print(f"[ITINERARY] Day {day} complete (Progress: {progress_after}%)")

            # Build summary for next day's context
            if day_items:
                summary = f"Day {day}: " + ", ".join([item.get('title', '') for item in day_items[:3]])
                previous_days_summary += summary + "\n"

        # Mark as completed
        await job_service.update_job_status(
            job_id,
            status="completed",
            progress=100,
            message=f"Generated {num_days}-day itinerary",
            result={"num_days": num_days}
        )

        print(f"[ITINERARY] Completed itinerary generation for trip {trip_id}")

    except Exception as e:
        print(f"Error in background itinerary generation: {e}")
        import traceback
        traceback.print_exc()
        await job_service.update_job_status(
            job_id,
            status="failed",
            progress=0,
            message="Failed to generate itinerary",
            error=str(e)
        )


def generate_itinerary_background(
    job_id: str,
    trip_id: str,
    job_service: JobService
):
    """
    Wrapper to spawn async background task in a separate thread without blocking.
    Creates a daemon thread that runs independently of the main request.
    """
    thread = threading.Thread(
        target=_run_async_in_thread,
        args=(_generate_itinerary_async(job_id, trip_id, job_service),),
        daemon=True  # Daemon thread won't prevent app shutdown
    )
    thread.start()
    print(f"[ITINERARY] Started background thread for job {job_id}")


@router.post("/generate", response_model=JobStatusResponse)
async def generate_itinerary(
    request: ItineraryGenerationRequest,
    job_service: JobService = Depends(get_job_service)
) -> JobStatusResponse:
    """
    Start async itinerary generation for a trip.

    This endpoint immediately returns a job ID that can be polled for status.
    The itinerary generation happens in a background thread.

    Args:
        request: Trip ID to generate itinerary for
        job_service: Injected job service

    Returns:
        Job status with job_id for polling
    """
    try:
        print(f"[ITINERARY API] Received generate request for trip: {request.trip_id}")

        # Create job
        job_id = await job_service.create_job(
            trip_id=request.trip_id,
            job_type="itinerary_generation"
        )
        print(f"[ITINERARY API] Created job: {job_id}")

        # Spawn background thread (non-blocking)
        print(f"[ITINERARY API] Spawning background thread...")
        generate_itinerary_background(
            job_id,
            request.trip_id,
            job_service
        )
        print(f"[ITINERARY API] Background thread spawned, returning immediately")

        # Return job status immediately
        job_status = await job_service.get_job_status(job_id)

        return JobStatusResponse(**job_status)

    except Exception as e:
        print(f"[ITINERARY API] ERROR: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to start itinerary generation: {str(e)}")


@router.post("/modify", response_model=JobStatusResponse)
async def modify_itinerary(
    request: ItineraryModificationRequest,
    job_service: JobService = Depends(get_job_service)
) -> JobStatusResponse:
    """
    Modify existing itinerary based on user request.

    This endpoint starts an async job to modify the itinerary using AI.
    The modification happens in a background thread.

    Args:
        request: Trip ID and modification request
        job_service: Injected job service

    Returns:
        Job status with job_id for polling
    """
    try:
        # Create job
        job_id = await job_service.create_job(
            trip_id=request.trip_id,
            job_type="itinerary_modification"
        )

        # Spawn background thread (non-blocking)
        modify_itinerary_background(
            job_id,
            request.trip_id,
            request.modification,
            job_service
        )

        # Return job status immediately
        job_status = await job_service.get_job_status(job_id)

        return JobStatusResponse(**job_status)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start itinerary modification: {str(e)}")


async def _modify_itinerary_async(
    job_id: str,
    trip_id: str,
    modification: str,
    job_service: JobService
):
    """
    Async coroutine to modify itinerary (runs in background).

    Args:
        job_id: Job ID
        trip_id: Trip ID
        modification: User's modification request
        job_service: Job service instance
    """
    try:
        await job_service.update_job_status(
            job_id,
            status="processing",
            progress=10,
            message="Fetching current itinerary"
        )

        # Get current itinerary and trip details
        supabase = get_supabase()

        trip_response = supabase.table("trips").select("*").eq("id", trip_id).single().execute()
        itinerary_response = supabase.table("itinerary_items").select("*").eq("trip_id", trip_id).execute()

        if not trip_response.data:
            raise ValueError(f"Trip {trip_id} not found")

        trip_data = trip_response.data
        existing_items = itinerary_response.data or []

        await job_service.update_job_status(
            job_id,
            status="processing",
            progress=30,
            message="Modifying itinerary with AI"
        )

        # Modify itinerary using agent
        agent = get_itinerary_agent()
        modified_items = agent.modify_itinerary(existing_items, modification, trip_data)

        await job_service.update_job_status(
            job_id,
            status="processing",
            progress=80,
            message="Updating database"
        )

        # Delete old items and insert new ones
        supabase.table("itinerary_items").delete().eq("trip_id", trip_id).execute()
        await job_service.save_itinerary_items(trip_id, modified_items)

        await job_service.update_job_status(
            job_id,
            status="completed",
            progress=100,
            message="Itinerary modified successfully",
            result={"items_count": len(modified_items)}
        )

    except Exception as e:
        print(f"Error in background itinerary modification: {e}")
        await job_service.update_job_status(
            job_id,
            status="failed",
            progress=0,
            message="Failed to modify itinerary",
            error=str(e)
        )


def modify_itinerary_background(
    job_id: str,
    trip_id: str,
    modification: str,
    job_service: JobService
):
    """
    Wrapper to spawn async background task in a separate thread without blocking.
    Creates a daemon thread that runs independently of the main request.
    """
    thread = threading.Thread(
        target=_run_async_in_thread,
        args=(_modify_itinerary_async(job_id, trip_id, modification, job_service),),
        daemon=True
    )
    thread.start()
    print(f"[ITINERARY] Started background thread for modification job {job_id}")


@router.get("/status/{job_id}", response_model=JobStatusResponse)
async def get_job_status(
    job_id: str,
    job_service: JobService = Depends(get_job_service)
) -> JobStatusResponse:
    """
    Get the status of an itinerary generation/modification job.

    Frontend should poll this endpoint every 2-3 seconds until status is 'completed' or 'failed'.

    Args:
        job_id: Job ID from generate or modify endpoint
        job_service: Injected job service

    Returns:
        Current job status
    """
    job_status = await job_service.get_job_status(job_id)

    if not job_status:
        raise HTTPException(status_code=404, detail=f"Job {job_id} not found")

    return JobStatusResponse(**job_status)
