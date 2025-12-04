"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Checkbox,
  Chip,
  CircularProgress,
  Alert,
  AlertTitle,
  LinearProgress,
  Divider,
  IconButton,
  Tooltip,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import { Assignment, CheckCircle, Error as ErrorIcon, Map as MapIcon, AutoAwesome } from "@mui/icons-material";
import { useTaskGeneration } from "@/hooks/useTaskGeneration";
import { toggleTaskCompletion } from "@/app/trip/[id]/task-actions";
import { useTransition, useState, useEffect } from "react";
import AccommodationRecommendationsModal from "./accommodation-recommendations-modal";

interface Task {
  id: string;
  trip_id: string;
  title: string;
  description?: string;
  category: string;
  priority: string;
  is_completed: boolean;
  created_at: string;
}

interface TasksLiveViewProps {
  tripId: string;
}

async function fetchTasks(tripId: string): Promise<Task[]> {
  const response = await fetch(`/api/tasks/${tripId}`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error("Failed to fetch tasks");
  }
  return response.json();
}

export default function TasksLiveView({ tripId }: TasksLiveViewProps) {
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();
  const [jobId, setJobId] = useState<string | null>(null);
  const [accommodationModalOpen, setAccommodationModalOpen] = useState(false);
  const [selectedAccommodationTask, setSelectedAccommodationTask] = useState<{
    destination: string;
    nightsCount: number;
  } | null>(null);

  // Check if generation is in progress (only on client side)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedJobId = localStorage.getItem(`task-job-${tripId}`);
      setJobId(storedJobId);

      // If jobId exists but generation is not active, clear it after a short delay
      // This handles cases where the hook hasn't cleaned it up yet
      if (storedJobId) {
        const timeout = setTimeout(() => {
          const stillExists = localStorage.getItem(`task-job-${tripId}`);
          if (stillExists === storedJobId) {
            // If it's still there after 5 seconds and no generation is happening, clear it
            console.log("[TasksLiveView] Clearing potentially stale jobId after timeout");
          }
        }, 5000);
        return () => clearTimeout(timeout);
      }
    }
  }, [tripId]);

  const { isGenerating, isCompleted, isFailed, progress, message, error, jobStatus } = useTaskGeneration(
    tripId,
    jobId
  );

  // If jobStatus is null (404), immediately clear the jobId
  useEffect(() => {
    if (jobId && jobStatus === null) {
      console.log("[TasksLiveView] Job not found, clearing jobId from state");
      setJobId(null);
    }
  }, [jobId, jobStatus]);

  // Fetch tasks with auto-refetch (only while generating)
  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ["tasks", tripId],
    queryFn: () => fetchTasks(tripId),
    refetchInterval: (query) => {
      // Only poll if actively generating
      return isGenerating === true ? 3000 : false;
    },
    staleTime: 0,
  });

  // Separate general and destination-specific tasks
  const generalTasks = tasks.filter(
    (task) =>
      task.category === "general" ||
      task.category === "finance" ||
      task.category === "health" ||
      task.category === "documentation" ||
      task.category === "packing"
  );

  const destinationTasks = tasks.filter(
    (task) =>
      task.category === "visa" ||
      task.category === "accommodation" ||
      task.category === "transportation" ||
      task.category === "activities"
  );

  // Calculate completion stats
  const completedCount = tasks.filter((t) => t.is_completed).length;
  const totalCount = tasks.length;
  const completionPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const handleToggleTask = async (taskId: string, currentStatus: boolean) => {
    // Optimistic update - update UI immediately
    queryClient.setQueryData<Task[]>(["tasks", tripId], (old) => {
      if (!old) return old;
      return old.map((task) =>
        task.id === taskId ? { ...task, is_completed: !currentStatus } : task
      );
    });

    startTransition(async () => {
      try {
        await toggleTaskCompletion(taskId, !currentStatus);
        // Refetch to sync with server (but order won't change)
        queryClient.invalidateQueries({ queryKey: ["tasks", tripId] });
      } catch (error) {
        console.error("Failed to toggle task:", error);
        // Revert optimistic update on error
        queryClient.invalidateQueries({ queryKey: ["tasks", tripId] });
      }
    });
  };

  const handleAccommodationAI = (task: Task) => {
    // Extract destination from task title (e.g., "Book accommodation in Tokyo")
    const match = task.title.match(/accommodation in (.+?)(?:\s|$)/i);
    const destination = match && match[1] ? match[1].trim() : "Unknown";

    // Default to 3 nights if we can't determine from task
    const nightsCount = 3;

    setSelectedAccommodationTask({ destination, nightsCount });
    setAccommodationModalOpen(true);
  };

  const handleCloseAccommodationModal = () => {
    setAccommodationModalOpen(false);
    setSelectedAccommodationTask(null);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "high":
        return "error";
      case "medium":
        return "warning";
      case "low":
        return "info";
      default:
        return "default";
    }
  };

  const getCategoryLabel = (category: string) => {
    return category.charAt(0).toUpperCase() + category.slice(1).replace(/_/g, " ");
  };

  // Show generation status if in progress
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
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Generating Your Tasks...
          </Typography>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {message || "Our AI is creating a personalized task list for your trip"}
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
      </Box>
    );
  }

  // Show error if failed
  if (isFailed) {
    const errorMessage = error instanceof Error ? error.message : error;
    return (
      <Alert severity="error" icon={<ErrorIcon />} sx={{ mb: 3 }}>
        <AlertTitle>Task Generation Failed</AlertTitle>
        {errorMessage || "There was an error generating your tasks. Please try again."}
      </Alert>
    );
  }

  // Show empty state if no tasks
  if (tasks.length === 0 && !isLoading) {
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
        <Assignment sx={{ fontSize: 64, color: "text.secondary", mb: 2, opacity: 0.5 }} />
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          No Tasks Yet
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Tasks are being generated for your trip...
        </Typography>
      </Paper>
    );
  }

  // Group tasks by priority
  const groupTasksByPriority = (taskList: Task[]) => {
    const high = taskList.filter((t) => t.priority.toLowerCase() === "high");
    const medium = taskList.filter((t) => t.priority.toLowerCase() === "medium");
    const low = taskList.filter((t) => t.priority.toLowerCase() === "low");
    return { high, medium, low };
  };

  // Helper to render task item with optional AI button
  const renderTaskItem = (task: Task) => {
    const isAccommodation = task.category === "accommodation";

    return (
      <ListItem
        key={task.id}
        disablePadding
        secondaryAction={
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {isAccommodation && (
              <Tooltip title="AI Recommendations">
                <IconButton
                  size="small"
                  onClick={() => handleAccommodationAI(task)}
                  sx={{
                    bgcolor: 'primary.light',
                    color: 'primary.contrastText',
                    '&:hover': {
                      bgcolor: 'primary.main',
                    },
                  }}
                >
                  <AutoAwesome fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            <Checkbox
              edge="end"
              checked={task.is_completed}
              onChange={() => handleToggleTask(task.id, task.is_completed)}
              disabled={isPending}
              tabIndex={-1}
            />
          </Box>
        }
        sx={{
          mb: 1,
          pl: 2,
          pr: isAccommodation ? 12 : 7, // More space if AI button is present
          py: 1,
          borderRadius: 1,
          bgcolor: task.is_completed ? "rgba(76, 175, 80, 0.08)" : "transparent",
          border: "1px solid",
          borderColor: task.is_completed ? "rgba(76, 175, 80, 0.3)" : "divider",
          "&:hover": {
            bgcolor: task.is_completed
              ? "rgba(76, 175, 80, 0.12)"
              : "rgba(0, 0, 0, 0.04)",
          },
        }}
      >
        <ListItemText
          primary={
            <Typography
              variant="body2"
              sx={{
                textDecoration: task.is_completed ? "line-through" : "none",
                color: task.is_completed ? "text.secondary" : "text.primary",
                pr: 1,
              }}
            >
              {task.title}
            </Typography>
          }
          secondary={task.description}
          sx={{ pr: 1 }}
        />
      </ListItem>
    );
  };

  // Render task list grouped by priority
  const renderTaskList = (taskList: Task[]) => {
    if (taskList.length === 0) {
      return (
        <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
          No tasks yet.
        </Typography>
      );
    }

    const { high, medium, low } = groupTasksByPriority(taskList);

    return (
      <>
        {/* High Priority Tasks */}
        {high.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="subtitle2"
              sx={{
                color: "error.main",
                fontWeight: 600,
                mb: 1,
                textTransform: "uppercase",
                fontSize: "0.75rem",
              }}
            >
              High Priority
            </Typography>
            <List disablePadding>
              {high.map((task) => renderTaskItem(task))}
            </List>
          </Box>
        )}

        {/* Medium Priority Tasks */}
        {medium.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="subtitle2"
              sx={{
                color: "warning.main",
                fontWeight: 600,
                mb: 1,
                textTransform: "uppercase",
                fontSize: "0.75rem",
              }}
            >
              Medium Priority
            </Typography>
            <List disablePadding>
              {medium.map((task) => renderTaskItem(task))}
            </List>
          </Box>
        )}

        {/* Low Priority Tasks */}
        {low.length > 0 && (
          <Box>
            <Typography
              variant="subtitle2"
              sx={{
                color: "info.main",
                fontWeight: 600,
                mb: 1,
                textTransform: "uppercase",
                fontSize: "0.75rem",
              }}
            >
              Low Priority
            </Typography>
            <List disablePadding>
              {low.map((task) => renderTaskItem(task))}
            </List>
          </Box>
        )}
      </>
    );
  };

  // Show tasks
  return (
    <>
      {/* Progress Section */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography variant="h6">Task Progress</Typography>
          <Typography variant="h6" color="primary">
            {completedCount}/{totalCount}
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={completionPercentage}
          sx={{ height: 10, borderRadius: 5 }}
        />
      </Paper>

      {/* Two-column layout: General Tasks | Destination Tasks */}
      <Grid container spacing={3}>
        {/* General Tasks (Left) */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, height: "100%" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <Assignment color="action" />
              <Typography variant="h6">General Tasks</Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            {renderTaskList(generalTasks)}
          </Paper>
        </Grid>

        {/* Destination Tasks (Right) */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, height: "100%" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <MapIcon color="action" />
              <Typography variant="h6">Destination Tasks</Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            {renderTaskList(destinationTasks)}
          </Paper>
        </Grid>
      </Grid>

      {/* Accommodation Recommendations Modal */}
      {selectedAccommodationTask && (
        <AccommodationRecommendationsModal
          open={accommodationModalOpen}
          onClose={handleCloseAccommodationModal}
          tripId={tripId}
          destination={selectedAccommodationTask.destination}
          nightsCount={selectedAccommodationTask.nightsCount}
        />
      )}
    </>
  );
}
