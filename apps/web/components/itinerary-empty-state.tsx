"use client";

import { Box, Button, Typography, Paper } from "@mui/material";
import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import ItineraryGenerationStatus from "./itinerary-generation-status";

interface ItineraryEmptyStateProps {
  tripId: string;
}

async function startItineraryGeneration(tripId: string) {
  const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/$/, "");

  const response = await fetch(`${API_URL}/itinerary/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ trip_id: tripId }),
  });

  if (!response.ok) {
    throw new Error("Failed to start itinerary generation");
  }

  return await response.json();
}

export default function ItineraryEmptyState({ tripId }: ItineraryEmptyStateProps) {
  const [jobId, setJobId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Check localStorage for existing job on mount
  useEffect(() => {
    const storedJobId = localStorage.getItem(`itinerary-job-${tripId}`);
    if (storedJobId) {
      setJobId(storedJobId);
    }
  }, [tripId]);

  const { mutate: generateItinerary, isPending } = useMutation({
    mutationFn: () => startItineraryGeneration(tripId),
    onSuccess: (data) => {
      setJobId(data.job_id);
      // Store in localStorage for persistence across refreshes
      localStorage.setItem(`itinerary-job-${tripId}`, data.job_id);
    },
    onError: (error) => {
      console.error("Failed to start generation:", error);
    },
  });

  // If we have a job ID, show the status component
  if (jobId) {
    return <ItineraryGenerationStatus tripId={tripId} jobId={jobId} />;
  }

  return (
    <Paper
      elevation={0}
      sx={{
        p: 6,
        textAlign: "center",
        bgcolor: "rgba(0, 0, 0, 0.02)",
        border: "2px dashed",
        borderColor: "rgba(0, 0, 0, 0.1)",
        borderRadius: 3,
      }}
    >
      <AutoAwesomeIcon sx={{ fontSize: 64, color: "primary.main", mb: 2, opacity: 0.7 }} />

      <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
        No Itinerary Yet
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 500, mx: "auto" }}>
        Let our AI create a personalized day-by-day itinerary for your trip based on your preferences and budget.
      </Typography>

      <Button
        variant="contained"
        size="large"
        onClick={() => generateItinerary()}
        disabled={isPending}
        startIcon={<AutoAwesomeIcon />}
        sx={{
          px: 4,
          py: 1.5,
          borderRadius: 2,
          textTransform: "none",
          fontSize: 16,
          fontWeight: 600,
        }}
      >
        {isPending ? "Starting..." : "Generate Itinerary with AI"}
      </Button>

      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 2 }}>
        Generation takes 30-60 seconds
      </Typography>
    </Paper>
  );
}
