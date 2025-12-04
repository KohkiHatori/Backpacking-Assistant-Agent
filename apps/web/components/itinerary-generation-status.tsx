"use client";

import { Box, LinearProgress, Typography, Alert, AlertTitle, CircularProgress } from "@mui/material";
import { useItineraryGeneration } from "@/hooks/useItineraryGeneration";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";

interface ItineraryGenerationStatusProps {
  tripId: string;
  jobId: string | null;
}

export default function ItineraryGenerationStatus({ tripId, jobId }: ItineraryGenerationStatusProps) {
  const {
    jobStatus,
    isGenerating,
    isCompleted,
    isFailed,
    progress,
    message,
    error,
  } = useItineraryGeneration(tripId, jobId);

  // Don't show anything if no job
  if (!jobId) {
    return null;
  }

  // Completed state
  if (isCompleted) {
    return (
      <Alert
        severity="success"
        icon={<CheckCircleIcon />}
        sx={{ mb: 3 }}
      >
        <AlertTitle>Itinerary Generated!</AlertTitle>
        Your personalized itinerary is ready. Check the Itinerary tab below.
      </Alert>
    );
  }

  // Failed state
  if (isFailed) {
    const errorMessage = error instanceof Error ? error.message : error;
    return (
      <Alert
        severity="error"
        icon={<ErrorIcon />}
        sx={{ mb: 3 }}
      >
        <AlertTitle>Generation Failed</AlertTitle>
        {errorMessage || "There was an error generating your itinerary. Please try again."}
      </Alert>
    );
  }

  // Generating state
  if (isGenerating) {
    return (
      <Box
        sx={{
          mb: 3,
          p: 3,
          borderRadius: 2,
          bgcolor: "rgba(25, 118, 210, 0.08)",
          border: "1px solid",
          borderColor: "rgba(25, 118, 210, 0.2)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <CircularProgress size={20} sx={{ mr: 1.5 }} />
          <Typography variant="h6" sx={{ fontWeight: 600, display: "flex", alignItems: "center" }}>
            <AutoAwesomeIcon sx={{ mr: 1, fontSize: 20 }} />
            Generating Your Itinerary...
          </Typography>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {message || "Our AI is crafting a personalized itinerary for your trip"}
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              flex: 1,
              height: 8,
              borderRadius: 4,
              bgcolor: "rgba(25, 118, 210, 0.1)",
              "& .MuiLinearProgress-bar": {
                borderRadius: 4,
              },
            }}
          />
          <Typography variant="body2" sx={{ minWidth: 45, fontWeight: 600 }}>
            {progress}%
          </Typography>
        </Box>

        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
          This usually takes 30-60 seconds. You can navigate away and come back later.
        </Typography>
      </Box>
    );
  }

  return null;
}
