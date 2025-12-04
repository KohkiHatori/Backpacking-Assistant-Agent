from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, List
from schemas.trip_schemas import (
    TaskGenerationRequest,
    JobStatusResponse,
    Task
)
from services.job_service import get_job_service, JobService
from services.agents.sub_agents.task_agent import get_task_agent
from supabase import create_client, Client
import os
import asyncio
import threading

router = APIRouter(prefix="/tasks", tags=["tasks"])


def get_supabase() -> Client:
    """Get Supabase client."""
    return create_client(
        os.getenv("SUPABASE_URL"),
        os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    )


def _run_async_in_thread(coro):
    """
    Run an async coroutine in a new thread with its own event loop.
    This ensures it doesn't block the main request/response cycle.
    """
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        loop.run_until_complete(coro)
    finally:
        loop.close()


async def _generate_tasks_async(
    job_id: str,
    trip_id: str,
    job_service: JobService
):
    """Actual async task to generate tasks."""
    print(f"[TASKS] Starting async generation for job {job_id}, trip {trip_id}")
    try:
        await job_service.update_job_status(
            job_id,
            status="processing",
            progress=10,
            message="Fetching trip details"
        )

        # Fetch trip data from Supabase
        supabase = get_supabase()
        trip_response = supabase.table("trips").select("*").eq("id", trip_id).single().execute()

        if not trip_response.data:
            raise ValueError(f"Trip {trip_id} not found")

        trip_data = trip_response.data
        print(f"[TASKS] Fetched trip data for trip {trip_id}")

        # Fetch user's citizenship for visa checking
        user_citizenship = None
        user_id = trip_data.get("user_id")
        if user_id:
            try:
                user_response = supabase.table("users").select("citizenship").eq("id", user_id).single().execute()
                if user_response.data:
                    user_citizenship = user_response.data.get("citizenship")
                    print(f"[TASKS] User citizenship: {user_citizenship}")
            except Exception as e:
                print(f"[TASKS] Could not fetch user citizenship: {e}")

        await job_service.update_job_status(
            job_id,
            status="processing",
            progress=30,
            message="Generating tasks with AI"
        )

        # Generate tasks using the task agent
        agent = get_task_agent()
        tasks = agent.generate_tasks(trip_data, user_citizenship)
        print(f"[TASKS] Generated {len(tasks)} tasks for trip {trip_id}")

        await job_service.update_job_status(
            job_id,
            status="processing",
            progress=70,
            message="Saving tasks to database"
        )

        # Save tasks to Supabase
        await job_service.save_tasks(trip_id, tasks)
        print(f"[TASKS] Saved {len(tasks)} tasks for trip {trip_id}")

        await job_service.update_job_status(
            job_id,
            status="completed",
            progress=100,
            message="Tasks generated successfully",
            result={"tasks_count": len(tasks)}
        )
        print(f"[TASKS] Job {job_id} completed for trip {trip_id}")

    except Exception as e:
        print(f"[TASKS] Error in background task generation for job {job_id}: {e}")
        await job_service.update_job_status(
            job_id,
            status="failed",
            progress=0,
            message="Failed to generate tasks",
            error=str(e)
        )


def generate_tasks_background(
    job_id: str,
    trip_id: str,
    job_service: JobService
):
    """
    Wrapper to spawn async background task in a separate thread without blocking.
    """
    thread = threading.Thread(
        target=_run_async_in_thread,
        args=(_generate_tasks_async(job_id, trip_id, job_service),),
        daemon=True
    )
    thread.start()
    print(f"[TASKS] Started background thread for job {job_id}")


@router.post("/generate", response_model=JobStatusResponse)
async def generate_tasks(
    request: TaskGenerationRequest,
    job_service: JobService = Depends(get_job_service)
) -> JobStatusResponse:
    """
    Start async task generation for a trip.

    This endpoint immediately returns a job ID and starts task generation in the background.
    The client can poll the /tasks/status/{job_id} endpoint to check progress.

    Args:
        request: TaskGenerationRequest with trip_id

    Returns:
        JobStatusResponse with job ID and initial status
    """
    print(f"[TASKS API] Received generate request for trip: {request.trip_id}")
    try:
        # Create a job for tracking
        job_id = await job_service.create_job(
            trip_id=request.trip_id,
            job_type="task_generation"
        )
        print(f"[TASKS API] Created job: {job_id}")

        # Start background task generation (non-blocking)
        generate_tasks_background(
            job_id,
            request.trip_id,
            job_service
        )
        print(f"[TASKS API] Background thread spawned, returning immediately")

        # Return job status immediately
        job_status = await job_service.get_job_status(job_id)
        return JobStatusResponse(**job_status)

    except Exception as e:
        print(f"[TASKS API] ERROR: Failed to start task generation: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to start task generation: {str(e)}"
        )


@router.get("/status/{job_id}", response_model=JobStatusResponse)
async def get_task_generation_status(
    job_id: str,
    job_service: JobService = Depends(get_job_service)
) -> JobStatusResponse:
    """
    Get the status of a task generation job.

    Args:
        job_id: Job ID returned from the /tasks/generate endpoint

    Returns:
        JobStatusResponse with current job status, progress, and results
    """
    try:
        job_status = await job_service.get_job_status(job_id)
        if not job_status:
            raise HTTPException(status_code=404, detail="Job not found")
        return JobStatusResponse(**job_status)
    except HTTPException:
        # Re-raise HTTP exceptions (like 404) as-is
        raise
    except Exception as e:
        print(f"Error getting job status: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get job status: {str(e)}")
