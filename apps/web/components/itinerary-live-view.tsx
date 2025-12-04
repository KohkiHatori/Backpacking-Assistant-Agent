"use client";

import { useQuery } from "@tanstack/react-query";
import { Box, Button, Typography, Stack, Paper, Chip, CircularProgress } from "@mui/material";
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, LocationOn, AttachMoney, Hotel, Restaurant, DirectionsCar, LocalActivity } from "@mui/icons-material";
import { format, differenceInCalendarDays, addDays } from "date-fns";
import ItineraryEmptyState from "./itinerary-empty-state";
import { useItineraryGeneration } from "@/hooks/useItineraryGeneration";

interface ItineraryItem {
  id: string;
  trip_id: string;
  day_number: number;
  date: string;
  start_time?: string;
  end_time?: string;
  title: string;
  description?: string;
  location?: string;
  type: string;
  cost?: number;
  order_index: number;
}

interface ItineraryLiveViewProps {
  tripId: string;
  startDate?: string | null;
  endDate?: string | null;
  currency: string;
}

async function fetchItinerary(tripId: string): Promise<ItineraryItem[]> {
  const response = await fetch(`/api/itinerary/${tripId}`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error("Failed to fetch itinerary");
  }
  return response.json();
}

export default function ItineraryLiveView({
  tripId,
  startDate,
  endDate,
  currency,
}: ItineraryLiveViewProps) {
  const [currentDay, setCurrentDay] = useState(1);

  // Check if generation is in progress
  const jobId = typeof window !== 'undefined'
    ? localStorage.getItem(`itinerary-job-${tripId}`)
    : null;
  const { isGenerating, isCompleted } = useItineraryGeneration(tripId, jobId);

  // Fetch itinerary with auto-refetch (only while generating)
  const { data: itineraryItems = [], isLoading } = useQuery<ItineraryItem[]>({
    queryKey: ["itinerary", tripId],
    queryFn: () => fetchItinerary(tripId),
    refetchInterval: isGenerating ? 3000 : false, // Only refetch while generating
    staleTime: 0,
  });

  // Calculate max days
  const maxDays = startDate && endDate
    ? differenceInCalendarDays(new Date(endDate), new Date(startDate)) + 1
    : 1;

  // Get current day date
  const currentDayDate = startDate ? addDays(new Date(startDate), currentDay - 1) : null;

  // Group items by day
  const itemsByDay: Record<number, ItineraryItem[]> = {};
  itineraryItems.forEach((item) => {
    if (!itemsByDay[item.day_number]) {
      itemsByDay[item.day_number] = [];
    }
    itemsByDay[item.day_number]!.push(item);
  });

  // Sort items within each day
  Object.keys(itemsByDay).forEach((day) => {
    const dayNum = parseInt(day);
    if (itemsByDay[dayNum]) {
      itemsByDay[dayNum].sort((a, b) => a.order_index - b.order_index);
    }
  });

  const handleNextDay = () => {
    if (currentDay < maxDays) {
      setCurrentDay(currentDay + 1);
    }
  };

  const handlePrevDay = () => {
    if (currentDay > 1) {
      setCurrentDay(currentDay - 1);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "accommodation":
        return <Hotel color="primary" />;
      case "meal":
      case "restaurant":
        return <Restaurant color="primary" />;
      case "transport":
      case "transportation":
        return <DirectionsCar color="primary" />;
      case "activity":
      default:
        return <LocalActivity color="primary" />;
    }
  };

  // Show empty state if no items
  if (itineraryItems.length === 0 && !isLoading) {
    return <ItineraryEmptyState tripId={tripId} />;
  }

  return (
    <>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
        <Box sx={{ width: 100 }}>
          {currentDay > 1 && (
            <Button onClick={handlePrevDay} variant="outlined" fullWidth>
              <ChevronLeft />
            </Button>
          )}
        </Box>

        <Box sx={{ textAlign: "center" }}>
          <Typography variant="h5" fontWeight="bold">
            Day {currentDay}
          </Typography>
          {currentDayDate && (
            <Typography variant="subtitle1" color="text.secondary">
              {format(currentDayDate, "EEEE, MMMM d")}
            </Typography>
          )}
        </Box>

        <Box sx={{ width: 100 }}>
          {currentDay < maxDays && (
            <Button onClick={handleNextDay} variant="outlined" fullWidth>
              <ChevronRight />
            </Button>
          )}
        </Box>
      </Box>

      <Stack spacing={3}>
        {itemsByDay[currentDay] && itemsByDay[currentDay].length > 0 ? (
          itemsByDay[currentDay].map((item) => (
            <Paper key={item.id} sx={{ p: 2, display: "flex", gap: 2 }}>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  minWidth: 80,
                  gap: 1,
                }}
              >
                {getTypeIcon(item.type)}
                <Typography variant="caption" color="text.secondary">
                  {item.start_time?.slice(0, 5) || "--:--"}
                </Typography>
              </Box>

              <Box sx={{ flex: 1 }}>
                <Typography variant="h6">{item.title}</Typography>
                {item.description && (
                  <Typography variant="body2" color="text.secondary" paragraph sx={{ mb: 1 }}>
                    {item.description}
                  </Typography>
                )}

                <Box sx={{ display: "flex", gap: 2, mt: 1 }}>
                  {item.location && (
                    <Chip
                      icon={<LocationOn fontSize="small" />}
                      label={item.location}
                      size="small"
                      variant="outlined"
                    />
                  )}
                  {item.cost && item.cost > 0 && (
                    <Chip
                      icon={<AttachMoney fontSize="small" />}
                      label={`${item.cost} ${currency}`}
                      size="small"
                      variant="outlined"
                    />
                  )}
                </Box>
              </Box>
            </Paper>
          ))
        ) : (
          <Paper sx={{ p: 4, textAlign: "center" }}>
            <CircularProgress size={40} sx={{ mb: 2 }} />
            <Typography color="text.secondary">
              Generating Day {currentDay}...
            </Typography>
          </Paper>
        )}
      </Stack>
    </>
  );
}
