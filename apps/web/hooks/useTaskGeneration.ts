import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

interface JobStatus {
  job_id: string;
  trip_id: string;
  status: "pending" | "processing" | "completed" | "failed";
  progress: number;
  message?: string;
  result?: any;
  error?: string;
  created_at: string;
  updated_at: string;
}

async function checkTaskJobStatus(jobId: string): Promise<JobStatus | null> {
  const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/$/, "");
  const response = await fetch(`${API_URL}/tasks/status/${jobId}`, {
    cache: "no-store",
  });

  // If job not found (404), return null and clean up localStorage
  if (response.status === 404) {
    console.log(`[useTaskGeneration] Job ${jobId} not found (404), cleaning up localStorage`);
    return null;
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch task job status: ${response.status}`);
  }

  return response.json();
}

export function useTaskGeneration(tripId: string, jobId: string | null) {
  const queryClient = useQueryClient();

  // Poll job status - ONLY if there's a jobId
  const { data: jobStatus, error } = useQuery<JobStatus | null>({
    queryKey: ["task-job", jobId],
    queryFn: () => checkTaskJobStatus(jobId!),
    enabled: !!jobId, // Only enable if jobId exists
    refetchInterval: (query) => {
      const data = query.state.data;
      // Stop polling if no data (404), completed, or failed
      if (!data || data === null || data?.status === "completed" || data?.status === "failed") {
        return false;
      }
      // Poll every 2 seconds while pending or processing
      return 2000;
    },
    retry: false, // Don't retry - if it fails, stop immediately
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
    refetchOnMount: false, // Don't refetch on component mount if we have data
  });

  // When generation completes OR job not found, cleanup localStorage
  useEffect(() => {
    if (typeof window !== "undefined" && jobId) {
      // Job completed successfully
      if (jobStatus?.status === "completed") {
        queryClient.invalidateQueries({ queryKey: ["tasks", tripId] });
        localStorage.removeItem(`task-job-${tripId}`);
        console.log(`[useTaskGeneration] Cleaned up completed job ${jobId}`);
      }
      // Job not found (404) - cleanup stale jobId
      else if (jobStatus === null) {
        localStorage.removeItem(`task-job-${tripId}`);
        console.log(`[useTaskGeneration] Cleaned up stale job ${jobId}`);
      }
    }
  }, [jobStatus, tripId, jobId, queryClient]);

  // If no jobId, return defaults (not generating)
  if (!jobId) {
    return {
      jobStatus: undefined,
      isGenerating: false,
      isCompleted: false,
      isFailed: false,
      progress: 0,
      message: undefined,
      error: undefined,
    };
  }

  return {
    jobStatus, // Export jobStatus so components can check if it's null
    isGenerating: jobStatus?.status === "pending" || jobStatus?.status === "processing",
    isCompleted: jobStatus?.status === "completed",
    isFailed: jobStatus?.status === "failed",
    progress: jobStatus?.progress ?? 0,
    message: jobStatus?.message,
    error: error || jobStatus?.error,
  };
}
