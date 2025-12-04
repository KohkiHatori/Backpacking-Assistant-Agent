import { useQuery, useQueryClient } from "@tanstack/react-query";
import { checkItineraryJobStatus } from "@/app/trip/[id]/itinerary-actions";
import { useEffect, useState, useRef } from "react";

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

export function useItineraryGeneration(tripId: string, jobId: string | null) {
  const queryClient = useQueryClient();
  const [isPolling, setIsPolling] = useState(!!jobId);
  const lastProgressRef = useRef(0);

  // Poll job status
  const { data: jobStatus, error } = useQuery<JobStatus>({
    queryKey: ["itinerary-job", jobId],
    queryFn: () => checkItineraryJobStatus(jobId!),
    enabled: isPolling && !!jobId,
    refetchInterval: (query) => {
      // Stop polling if completed or failed
      const data = query.state.data;
      if (data?.status === "completed" || data?.status === "failed") {
        setIsPolling(false);
        return false;
      }
      // Poll every 2 seconds while processing
      return 2000;
    },
    retry: 3,
  });

  // No more page reloads! The ItineraryLiveView component auto-fetches new data

  // When generation completes, cleanup and stop polling
  useEffect(() => {
    if (jobStatus?.status === "completed") {
      queryClient.invalidateQueries({ queryKey: ["itinerary", tripId] });
      setIsPolling(false);

      // Clean up localStorage after successful completion
      if (typeof window !== "undefined" && jobId) {
        localStorage.removeItem(`itinerary-job-${tripId}`);
      }
    }
  }, [jobStatus?.status, tripId, jobId, queryClient]);

  return {
    jobStatus,
    isGenerating: jobStatus?.status === "pending" || jobStatus?.status === "processing",
    isCompleted: jobStatus?.status === "completed",
    isFailed: jobStatus?.status === "failed",
    progress: jobStatus?.progress ?? 0,
    message: jobStatus?.message,
    error: error || jobStatus?.error,
  };
}
