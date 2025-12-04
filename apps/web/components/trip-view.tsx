"use client";

import { useState, useEffect } from "react";
import { Trip, ItineraryItem, Task } from "@/lib/schemas";
import { useStore } from "@/lib/store";
import { DestinationsStep } from "@/components/trip-creation/destinations-step";
import { DatesStep } from "@/components/trip-creation/dates-step";
import { TravelersStep } from "@/components/trip-creation/travelers-step";
import { PreferencesStep } from "@/components/trip-creation/preferences-step";
import { TransportationStep } from "@/components/trip-creation/transportation-step";
import { BudgetStep } from "@/components/trip-creation/budget-step";
import { updateTrip } from "@/app/trip/[id]/actions";
import ItineraryEmptyState from "./itinerary-empty-state";
import ItineraryLiveView from "./itinerary-live-view";
import TasksLiveView from "./tasks-live-view";
import Script from "next/script";
import { AdapterDateFns } from "@mui/x-date-pickers-pro/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers-pro/LocalizationProvider";
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Paper,
  Chip,
  Stack,
  Divider,
  IconButton,
  Button,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Checkbox,
  TextField,
  CircularProgress,
  Snackbar,
  Alert,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import {
  CalendarToday,
  LocationOn,
  AttachMoney,
  People,
  Flight,
  Interests,
  ChevronLeft,
  ChevronRight,
  AccessTime,
  Hotel,
  Restaurant,
  DirectionsCar,
  LocalActivity,
  Place,
  Assignment,
  Map as MapIcon,
  Save as SaveIcon,
  Edit as EditIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { format, differenceInCalendarDays, addDays } from "date-fns";

interface TripViewProps {
  trip: Trip;
  itineraryItems: ItineraryItem[];
  tasks: Task[];
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`trip-tabpanel-${index}`}
      aria-labelledby={`trip-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `trip-tab-${index}`,
    "aria-controls": `trip-tabpanel-${index}`,
  };
}

export default function TripView({ trip, itineraryItems, tasks }: TripViewProps) {
  const [value, setValue] = useState(0);
  const [currentDay, setCurrentDay] = useState(1);
  const [isHydrated, setIsHydrated] = useState(false);
  const store = useStore();
  const [saving, setSaving] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // Restore tab from URL hash on mount (client-side only)
  useEffect(() => {
    setIsHydrated(true);
    const hash = window.location.hash;
    if (hash === '#itinerary') {
      setValue(1);
    } else if (hash === '#tasks') {
      setValue(2);
    } else if (hash === '#map') {
      setValue(3);
    }
  }, []);

  // Update URL hash when tab changes
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
    const tabs = ['overview', 'itinerary', 'tasks', 'map'];
    window.location.hash = tabs[newValue] || 'overview';
  };

  // Edit mode states for each section
  const [editingTripInfo, setEditingTripInfo] = useState(false);
  const [editingDestinations, setEditingDestinations] = useState(false);
  const [editingDates, setEditingDates] = useState(false);
  const [editingPreferences, setEditingPreferences] = useState(false);
  const [editingTransportation, setEditingTransportation] = useState(false);
  const [editingTravelers, setEditingTravelers] = useState(false);
  const [editingBudget, setEditingBudget] = useState(false);

  // Check if Google Maps is already loaded
  useEffect(() => {
    if (typeof window !== 'undefined' && window.google?.maps?.places) {
      setScriptLoaded(true);
    }
  }, []);

  // Initialize store with trip data
  useEffect(() => {
    store.setField("destinations", trip.destinations);
    store.setField("startPoint", trip.start_point || "");
    store.setField("endPoint", trip.end_point || "");
    store.setField("startDate", trip.start_date ? new Date(trip.start_date!) : null);
    store.setField("endDate", trip.end_date ? new Date(trip.end_date!) : null);
    store.setField("flexibleDates", trip.flexible_dates);
    store.setField("adultsCount", trip.adults_count);
    store.setField("childrenCount", trip.children_count);
    store.setField("preferences", trip.preferences);
    store.setField("transportation", trip.transportation);
    store.setField("budget", trip.budget || 0);
    store.setField("currency", trip.currency);
  }, []); // Only on mount

  // Local state for name and description as they are not in the store
  const [name, setName] = useState(trip.name);
  const [description, setDescription] = useState(trip.description || "");

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = {
        name,
        description,
        destinations: store.destinations,
        start_point: store.startPoint,
        end_point: store.endPoint,
        start_date: store.startDate ? format(store.startDate, "yyyy-MM-dd") : null,
        end_date: store.endDate ? format(store.endDate, "yyyy-MM-dd") : null,
        flexible_dates: store.flexibleDates,
        adults_count: store.adultsCount,
        children_count: store.childrenCount,
        preferences: store.preferences,
        transportation: store.transportation,
        budget: store.budget,
        currency: store.currency,
      };

      await updateTrip(trip.id, updates);
      setSnackbarOpen(true);

      // Close all edit modes after successful save
      setEditingTripInfo(false);
      setEditingDestinations(false);
      setEditingDates(false);
      setEditingPreferences(false);
      setEditingTransportation(false);
      setEditingTravelers(false);
      setEditingBudget(false);
    } catch (error) {
      console.error("Failed to update trip:", error);
      // Handle error UI
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    // Reset to original values
    setName(trip.name);
    setDescription(trip.description || "");
    store.setField("destinations", trip.destinations);
    store.setField("startPoint", trip.start_point || "");
    store.setField("endPoint", trip.end_point || "");
    store.setField("startDate", trip.start_date ? new Date(trip.start_date!) : null);
    store.setField("endDate", trip.end_date ? new Date(trip.end_date!) : null);
    store.setField("flexibleDates", trip.flexible_dates);
    store.setField("adultsCount", trip.adults_count);
    store.setField("childrenCount", trip.children_count);
    store.setField("preferences", trip.preferences);
    store.setField("transportation", trip.transportation);
    store.setField("budget", trip.budget || 0);
    store.setField("currency", trip.currency);

    // Close all edit modes
    setEditingTripInfo(false);
    setEditingDestinations(false);
    setEditingDates(false);
    setEditingPreferences(false);
    setEditingTransportation(false);
    setEditingTravelers(false);
    setEditingBudget(false);
  };


  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "Not set";
    return format(new Date(dateString), "MMM d, yyyy");
  };

  // Group items by day
  const itemsByDay = itineraryItems.reduce((acc, item) => {
    const day = item.day_number;
    if (!acc[day]) {
      acc[day] = [];
    }
    acc[day].push(item);
    return acc;
  }, {} as Record<number, ItineraryItem[]>);

  const maxDays = (() => {
    let days = 1;
    // 1. Calculate duration from dates
    if (trip.start_date && trip.end_date) {
      const start = new Date(trip.start_date);
      const end = new Date(trip.end_date);
      const diff = differenceInCalendarDays(end, start) + 1;
      if (diff > 0) days = Math.max(days, diff);
    }
    // 2. Check max day in existing items
    const itemDays = Object.keys(itemsByDay).map(Number);
    if (itemDays.length > 0) {
      days = Math.max(days, ...itemDays);
    }
    return days;
  })();

  const handlePrevDay = () => {
    setCurrentDay((prev) => Math.max(prev - 1, 1));
  };

  const handleNextDay = () => {
    setCurrentDay((prev) => Math.min(prev + 1, maxDays));
  };

  const getTypeIcon = (type?: string | null) => {
    switch (type) {
      case "accommodation":
        return <Hotel color="primary" />;
      case "meal":
        return <Restaurant color="secondary" />;
      case "transport":
        return <DirectionsCar color="action" />;
      case "activity":
        return <LocalActivity color="success" />;
      default:
        return <Place color="disabled" />;
    }
  };

  const getDayDate = (dayNumber: number) => {
    if (!trip.start_date) return null;
    const start = new Date(trip.start_date);
    return addDays(start, dayNumber - 1);
  };

  const currentDayDate = getDayDate(currentDay);

  // Tasks Logic
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.is_completed).length;
  const progress = totalTasks === 0 ? 0 : (completedTasks / totalTasks) * 100;

  const generalCategories = ["general", "packing", "preparation", "admin", null, ""];
  const generalTasks = tasks.filter((t) => generalCategories.includes(t.category ?? null));
  const destinationTasks = tasks.filter((t) => !generalCategories.includes(t.category ?? null));

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ width: "100%" }}>
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
          strategy="afterInteractive"
          onLoad={() => setScriptLoaded(true)}
        />
        <Box sx={{ borderBottom: 1, borderColor: "divider" }} suppressHydrationWarning>
          <Tabs
            value={value}
            onChange={handleTabChange}
            aria-label="trip tabs"
            variant="fullWidth"
            scrollButtons="auto"
            suppressHydrationWarning
          >
            <Tab label="Overview" {...a11yProps(0)} />
            <Tab label="Itinerary" {...a11yProps(1)} />
            <Tab label="Tasks" {...a11yProps(2)} />
          </Tabs>
        </Box>

        {/* Overview Tab */}
        <CustomTabPanel value={value} index={0}>
          <Grid container spacing={3}>
            {/* Main Details */}
            <Grid size={{ xs: 12, md: 8 }}>
              <Paper sx={{ p: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    Trip Info
                  </Typography>
                  {!editingTripInfo ? (
                    <IconButton onClick={() => setEditingTripInfo(true)} size="small">
                      <EditIcon />
                    </IconButton>
                  ) : (
                    <IconButton onClick={() => setEditingTripInfo(false)} size="small">
                      <CloseIcon />
                    </IconButton>
                  )}
                </Box>

                {editingTripInfo ? (
                  <>
                    <TextField
                      fullWidth
                      label="Trip Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      margin="normal"
                    />
                    <TextField
                      fullWidth
                      label="Description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      margin="normal"
                      multiline
                      rows={3}
                    />
                  </>
                ) : (
                  <Box sx={{ mt: 2 }}>
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 100 }}>
                        Name:
                      </Typography>
                      <Typography variant="body1">
                        {trip.name}
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={2} alignItems="flex-start">
                      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 100 }}>
                        Description:
                      </Typography>
                      <Typography variant="body1">
                        {trip.description || "No description"}
                      </Typography>
                    </Stack>
                  </Box>
                )}

                <Divider sx={{ my: 3 }} />

                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">
                      Destinations
                    </Typography>
                    {!editingDestinations ? (
                      <IconButton onClick={() => setEditingDestinations(true)} size="small">
                        <EditIcon />
                      </IconButton>
                    ) : (
                      <IconButton onClick={() => setEditingDestinations(false)} size="small">
                        <CloseIcon />
                      </IconButton>
                    )}
                  </Box>
                  {editingDestinations ? (
                    scriptLoaded ? <DestinationsStep /> : <CircularProgress />
                  ) : (
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Destinations
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
                        {trip.destinations.map((dest, idx) => (
                          <Chip key={idx} label={dest} icon={<LocationOn />} size="small" />
                        ))}
                      </Stack>
                      {(trip.start_point || trip.end_point) && (
                        <>
                          {trip.start_point && (
                            <Typography variant="body2" color="text.secondary">
                              Start: {trip.start_point}
                            </Typography>
                          )}
                          {trip.end_point && (
                            <Typography variant="body2" color="text.secondary">
                              End: {trip.end_point}
                            </Typography>
                          )}
                        </>
                      )}
                    </Box>
                  )}
                </Box>

                <Divider sx={{ my: 3 }} />

                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">
                      Dates
                    </Typography>
                    {!editingDates ? (
                      <IconButton onClick={() => setEditingDates(true)} size="small">
                        <EditIcon />
                      </IconButton>
                    ) : (
                      <IconButton onClick={() => setEditingDates(false)} size="small">
                        <CloseIcon />
                      </IconButton>
                    )}
                  </Box>
                  {editingDates ? (
                    <DatesStep />
                  ) : (
                    <Stack direction="row" spacing={1} alignItems="center">
                      <CalendarToday fontSize="small" color="action" />
                      <Typography variant="body1">
                        {formatDate(trip.start_date)} - {formatDate(trip.end_date)}
                      </Typography>
                    </Stack>
                  )}
                </Box>
              </Paper>

              <Paper sx={{ p: 3 }}>
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">
                      Preferences
                    </Typography>
                    {!editingPreferences ? (
                      <IconButton onClick={() => setEditingPreferences(true)} size="small">
                        <EditIcon />
                      </IconButton>
                    ) : (
                      <IconButton onClick={() => setEditingPreferences(false)} size="small">
                        <CloseIcon />
                      </IconButton>
                    )}
                  </Box>
                  {editingPreferences ? (
                    <PreferencesStep />
                  ) : (
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Travel Interests
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        {trip.preferences.map((pref, idx) => (
                          <Chip key={idx} label={pref} size="small" icon={<Interests />} />
                        ))}
                      </Stack>
                    </Box>
                  )}
                </Box>
                <Divider sx={{ my: 3 }} />
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">
                      Transportation
                    </Typography>
                    {!editingTransportation ? (
                      <IconButton onClick={() => setEditingTransportation(true)} size="small">
                        <EditIcon />
                      </IconButton>
                    ) : (
                      <IconButton onClick={() => setEditingTransportation(false)} size="small">
                        <CloseIcon />
                      </IconButton>
                    )}
                  </Box>
                  {editingTransportation ? (
                    <TransportationStep />
                  ) : (
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Transportation Methods
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        {trip.transportation.map((trans, idx) => (
                          <Chip key={idx} label={trans} size="small" icon={<Flight />} />
                        ))}
                      </Stack>
                    </Box>
                  )}
                </Box>
              </Paper>
            </Grid>

            {/* Side Stats */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Paper sx={{ p: 3, mb: 3 }}>
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">
                      Travelers
                    </Typography>
                    {!editingTravelers ? (
                      <IconButton onClick={() => setEditingTravelers(true)} size="small">
                        <EditIcon />
                      </IconButton>
                    ) : (
                      <IconButton onClick={() => setEditingTravelers(false)} size="small">
                        <CloseIcon />
                      </IconButton>
                    )}
                  </Box>
                  {editingTravelers ? (
                    <TravelersStep />
                  ) : (
                    <Stack spacing={1}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <People fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          Adults:
                        </Typography>
                        <Typography variant="body1">
                          {trip.adults_count}
                        </Typography>
                      </Stack>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <People fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          Children:
                        </Typography>
                        <Typography variant="body1">
                          {trip.children_count}
                        </Typography>
                      </Stack>
                    </Stack>
                  )}
                </Box>
                <Divider sx={{ my: 3 }} />
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">
                      Budget
                    </Typography>
                    {!editingBudget ? (
                      <IconButton onClick={() => setEditingBudget(true)} size="small">
                        <EditIcon />
                      </IconButton>
                    ) : (
                      <IconButton onClick={() => setEditingBudget(false)} size="small">
                        <CloseIcon />
                      </IconButton>
                    )}
                  </Box>
                  {editingBudget ? (
                    <BudgetStep />
                  ) : (
                    <Stack direction="row" spacing={1} alignItems="center">
                      <AttachMoney fontSize="small" color="action" />
                      <Typography variant="body1">
                        {trip.budget ? `${trip.budget} ${trip.currency}` : "No budget set"}
                      </Typography>
                    </Stack>
                  )}
                </Box>
              </Paper>
            </Grid>
          </Grid>

          {(editingTripInfo || editingDestinations || editingDates || editingPreferences || editingTransportation || editingTravelers || editingBudget) && (
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<CloseIcon />}
                onClick={handleCancelEdit}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </Box>
          )}
        </CustomTabPanel>

        {/* Itinerary Tab */}
        <CustomTabPanel value={value} index={1}>
          {/* Use live view that auto-refreshes */}
          <ItineraryLiveView
            tripId={trip.id}
            startDate={trip.start_date}
            endDate={trip.end_date}
            currency={trip.currency}
          />
          {/* Old static view - keeping as fallback
          {itineraryItems.length === 0 ? (
            <ItineraryEmptyState tripId={trip.id} />
          ) : (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Box sx={{ width: 100 }}>
                  {currentDay > 1 && (
                    <Button
                      onClick={handlePrevDay}
                      variant="outlined"
                      fullWidth
                    >
                      <ChevronLeft />
                    </Button>
                  )}
                </Box>

                <Box sx={{ textAlign: 'center' }}>
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
                    <Button
                      onClick={handleNextDay}
                      variant="outlined"
                      fullWidth
                    >
                      <ChevronRight />
                    </Button>
                  )}
                </Box>
              </Box>

              <Stack spacing={3}>
                {itemsByDay[currentDay]?.length ? (
                  itemsByDay[currentDay]!.map((item) => (
                    <Paper key={item.id} sx={{ p: 2, display: 'flex', gap: 2 }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 80, gap: 1 }}>
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

                        <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
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
                              label={`${item.cost} ${trip.currency}`}
                              size="small"
                              variant="outlined"
                            />
                          )}
                        </Box>
                      </Box>
                    </Paper>
                  ))
                ) : (
                  <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <Typography color="text.secondary">
                      No items planned for Day {currentDay} yet.
                    </Typography>
                  </Paper>
                )}
              </Stack>
            </>
          )}
          */}
        </CustomTabPanel>

        {/* Tasks Tab */}
        <CustomTabPanel value={value} index={2}>
          <TasksLiveView tripId={trip.id} />
        </CustomTabPanel>
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={() => setSnackbarOpen(false)}
          message="Trip updated successfully"
        >
          <Alert onClose={() => setSnackbarOpen(false)} severity="success" sx={{ width: '100%' }}>
            Trip updated successfully
          </Alert>
        </Snackbar>
      </Box>
    </LocalizationProvider>
  );
}
