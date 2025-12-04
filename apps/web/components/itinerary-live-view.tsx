"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Box, Button, Typography, Stack, Paper, Chip, CircularProgress, IconButton, Tooltip, TextField, Select, MenuItem, FormControl } from "@mui/material";
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, LocationOn, AttachMoney, Hotel, Restaurant, DirectionsCar, LocalActivity, Delete, Edit, Save, Close } from "@mui/icons-material";
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

async function deleteItineraryItem(itemId: string): Promise<void> {
  const response = await fetch(`/api/itinerary/item/${itemId}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("Failed to delete itinerary item");
  }
}

async function updateItineraryItem(itemId: string, updates: Partial<ItineraryItem>): Promise<ItineraryItem> {
  const response = await fetch(`/api/itinerary/item/${itemId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updates),
  });
  if (!response.ok) {
    throw new Error("Failed to update itinerary item");
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
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<ItineraryItem>>({});
  const queryClient = useQueryClient();

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

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteItineraryItem,
    onSuccess: () => {
      // Invalidate and refetch itinerary
      queryClient.invalidateQueries({ queryKey: ["itinerary", tripId] });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ itemId, updates }: { itemId: string; updates: Partial<ItineraryItem> }) =>
      updateItineraryItem(itemId, updates),
    onSuccess: () => {
      // Invalidate and refetch itinerary
      queryClient.invalidateQueries({ queryKey: ["itinerary", tripId] });
      setEditingItemId(null);
      setEditFormData({});
    },
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

  const handleDeleteItem = (itemId: string, itemTitle: string) => {
    // Show browser confirmation dialog
    if (window.confirm(`Are you sure you want to delete "${itemTitle}"? This action cannot be undone.`)) {
      deleteMutation.mutate(itemId);
    }
  };

  const handleEditItem = (item: ItineraryItem) => {
    setEditingItemId(item.id);
    setEditFormData({
      title: item.title,
      description: item.description || "",
      location: item.location || "",
      start_time: item.start_time || "",
      end_time: item.end_time || "",
      cost: item.cost || 0,
      type: item.type,
    });
  };

  const handleCancelEdit = () => {
    setEditingItemId(null);
    setEditFormData({});
  };

  const handleSaveEdit = (itemId: string) => {
    updateMutation.mutate({ itemId, updates: editFormData });
  };

  const handleFieldChange = (field: keyof ItineraryItem, value: any) => {
    setEditFormData((prev) => ({ ...prev, [field]: value }));
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

      <Stack spacing={0}>
        {itemsByDay[currentDay] && itemsByDay[currentDay].length > 0 ? (
          itemsByDay[currentDay]!.map((item, index) => (
            <Box
              key={item.id}
              sx={{
                display: "grid",
                gridTemplateColumns: "80px 1fr",
                gap: 2,
                minHeight: 100,
                borderBottom: index < itemsByDay[currentDay]!.length - 1 ? "1px solid" : "none",
                borderColor: "divider",
                py: 2,
              }}
            >
              {/* Time column */}
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  pr: 2,
                  pt: 0.5,
                  gap: 0.5,
                }}
              >
                {editingItemId === item.id ? (
                  <>
                    <TextField
                      size="small"
                      type="time"
                      value={editFormData.start_time?.slice(0, 5) || ""}
                      onChange={(e) => handleFieldChange("start_time", e.target.value + ":00")}
                      sx={{ width: 70 }}
                      inputProps={{ style: { fontSize: "0.875rem", padding: "4px 8px" } }}
                    />
                    <TextField
                      size="small"
                      type="time"
                      value={editFormData.end_time?.slice(0, 5) || ""}
                      onChange={(e) => handleFieldChange("end_time", e.target.value + ":00")}
                      sx={{ width: 70 }}
                      inputProps={{ style: { fontSize: "0.75rem", padding: "4px 8px" } }}
                    />
                  </>
                ) : (
                  <>
                    <Typography variant="body2" fontWeight="medium" color="text.primary">
                      {item.start_time?.slice(0, 5) || "--:--"}
                    </Typography>
                    {item.end_time && (
                      <Typography variant="caption" color="text.secondary">
                        {item.end_time.slice(0, 5)}
                      </Typography>
                    )}
                  </>
                )}
              </Box>

              {/* Event card column */}
              <Paper
                elevation={1}
                sx={{
                  p: 2,
                  display: "flex",
                  flexDirection: "column",
                  gap: 1,
                  position: "relative",
                  borderLeft: "4px solid",
                  borderLeftColor: (() => {
                    switch (item.type.toLowerCase()) {
                      case "accommodation":
                        return "primary.main";
                      case "meal":
                      case "restaurant":
                        return "success.main";
                      case "transport":
                      case "transportation":
                        return "warning.main";
                      case "activity":
                      default:
                        return "info.main";
                    }
                  })(),
                  "&:hover": {
                    boxShadow: 3,
                  },
                }}
              >
                {editingItemId === item.id ? (
                  // Edit mode
                  <>
                    {/* Header with icon, type selector, title field, and action buttons */}
                    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1, mb: 1 }}>
                      <FormControl size="small" sx={{ minWidth: 60 }}>
                        <Select
                          value={editFormData.type || item.type}
                          onChange={(e) => handleFieldChange("type", e.target.value)}
                          sx={{ "& .MuiSelect-select": { py: 0.5, display: "flex", alignItems: "center" } }}
                        >
                          <MenuItem value="activity">
                            <LocalActivity fontSize="small" />
                          </MenuItem>
                          <MenuItem value="accommodation">
                            <Hotel fontSize="small" />
                          </MenuItem>
                          <MenuItem value="meal">
                            <Restaurant fontSize="small" />
                          </MenuItem>
                          <MenuItem value="transport">
                            <DirectionsCar fontSize="small" />
                          </MenuItem>
                        </Select>
                      </FormControl>
                      <TextField
                        fullWidth
                        size="small"
                        value={editFormData.title || ""}
                        onChange={(e) => handleFieldChange("title", e.target.value)}
                        placeholder="Title"
                        sx={{ flex: 1 }}
                      />
                      <Tooltip title="Save">
                        <IconButton
                          onClick={() => handleSaveEdit(item.id)}
                          disabled={updateMutation.isPending}
                          color="primary"
                          size="small"
                        >
                          <Save fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Cancel">
                        <IconButton
                          onClick={handleCancelEdit}
                          disabled={updateMutation.isPending}
                          size="small"
                        >
                          <Close fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>

                    {/* Description field */}
                    <TextField
                      fullWidth
                      size="small"
                      multiline
                      rows={2}
                      value={editFormData.description || ""}
                      onChange={(e) => handleFieldChange("description", e.target.value)}
                      placeholder="Description"
                      sx={{ ml: 5, mb: 1 }}
                    />

                    {/* Location and cost fields */}
                    <Box sx={{ display: "flex", gap: 1, ml: 5 }}>
                      <TextField
                        size="small"
                        value={editFormData.location || ""}
                        onChange={(e) => handleFieldChange("location", e.target.value)}
                        placeholder="Location"
                        InputProps={{
                          startAdornment: <LocationOn fontSize="small" sx={{ mr: 0.5, color: "action.active" }} />,
                        }}
                        sx={{ flex: 1 }}
                      />
                      <TextField
                        size="small"
                        type="number"
                        value={editFormData.cost || ""}
                        onChange={(e) => handleFieldChange("cost", parseFloat(e.target.value) || 0)}
                        placeholder="Cost"
                        InputProps={{
                          startAdornment: <AttachMoney fontSize="small" sx={{ mr: 0.5, color: "action.active" }} />,
                        }}
                        sx={{ width: 120 }}
                      />
                    </Box>
                  </>
                ) : (
                  // View mode
                  <>
                    {/* Header with icon, title, edit and delete buttons */}
                    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                      <Box sx={{ mt: 0.5 }}>
                        {getTypeIcon(item.type)}
                      </Box>
                      <Typography variant="h6" sx={{ flex: 1, fontSize: "1.1rem" }}>
                        {item.title}
                      </Typography>
                      <Tooltip title="Edit item">
                        <IconButton
                          onClick={() => handleEditItem(item)}
                          size="small"
                          color="primary"
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete item">
                        <IconButton
                          onClick={() => handleDeleteItem(item.id, item.title)}
                          disabled={deleteMutation.isPending}
                          color="error"
                          size="small"
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>

                    {/* Description */}
                    {item.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 5 }}>
                        {item.description}
                      </Typography>
                    )}

                    {/* Location and cost chips */}
                    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", ml: 5, mt: 0.5 }}>
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
                          color="primary"
                        />
                      )}
                    </Box>
                  </>
                )}
              </Paper>
            </Box>
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
