"use client";

import { useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import Script from "next/script";
import {
  Container,
  Box,
  Typography,
  Button,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  IconButton,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Link from "next/link";
import { DestinationsStep, isDestinationsStepValid } from "@/components/trip-creation/destinations-step";
import { DatesStep } from "@/components/trip-creation/dates-step";
import { TravelersStep } from "@/components/trip-creation/travelers-step";
import { PreferencesStep } from "@/components/trip-creation/preferences-step";
import { TransportationStep } from "@/components/trip-creation/transportation-step";
import { BudgetStep } from "@/components/trip-creation/budget-step";
import { createTrip } from "./actions";
import { useRouter } from "next/navigation";

const steps = [
  "Destinations",
  "Dates",
  "Travelers",
  "Preferences",
  "Transportation",
  "Budget",
];

export default function CreateTripPage() {
  const store = useStore();
  const { step, nextStep, prevStep, setStep, resetForm } = store;
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // Reset the form when the component mounts
  useEffect(() => {
    resetForm();
  }, [resetForm]);

  // Check if user has entered any data
  const hasUnsavedData = (): boolean => {
    return (
      store.startPoint !== "" ||
      store.endPoint !== "" ||
      store.destinations.length > 0 ||
      store.startDate !== null ||
      store.endDate !== null ||
      store.adultsCount !== 1 ||
      store.childrenCount !== 0 ||
      store.preferences.length > 0 ||
      store.transportation.length > 0 ||
      store.budget !== 1000
    );
  };

  // Warn user before leaving page if they have unsaved data
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedData()) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [store]);

  const handleBackClick = (e: React.MouseEvent) => {
    if (hasUnsavedData()) {
      const confirmed = window.confirm(
        "You have unsaved changes. Are you sure you want to leave?"
      );
      if (!confirmed) {
        e.preventDefault();
      }
    }
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      // Extract only data fields, not functions
      const tripData = {
        destinations: store.destinations,
        startPoint: store.startPoint,
        endPoint: store.endPoint,
        startDate: store.startDate,
        endDate: store.endDate,
        flexibleDates: store.flexibleDates,
        adultsCount: store.adultsCount,
        childrenCount: store.childrenCount,
        preferences: store.preferences,
        transportation: store.transportation,
        budget: store.budget,
        currency: store.currency,
      };
      const trip = await createTrip(tripData);
      if (trip?.id) {
        router.push(`/trip/${trip.id}`);
      } else {
        router.push("/");
      }
    } catch (error) {
      console.error("Failed to create trip:", error);
      // Handle error state in UI
    } finally {
      setLoading(false);
    }
  };

  const isStepValid = (stepIndex: number): boolean => {
    switch (stepIndex) {
      case 0:
        return isDestinationsStepValid(
          store.startPoint,
          store.destinations,
          store.endPoint
        );
      case 1:
        return store.startDate !== null && store.endDate !== null;
      case 2:
        return store.adultsCount >= 1; // At least 1 adult required
      case 3:
        return true; // Preferences are optional
      case 4:
        return true; // Transportation is optional
      case 5:
        return store.budget > 0;
      default:
        return true;
    }
  };

  const isCurrentStepValid = (): boolean => {
    return isStepValid(step);
  };

  const canNavigateToStep = (targetStep: number): boolean => {
    if (targetStep <= step) {
      // Can always go back to previous steps
      return true;
    }
    // Can only go forward if all previous steps are completed
    for (let i = 0; i < targetStep; i++) {
      if (!isStepValid(i)) {
        return false;
      }
    }
    return true;
  };

  const handleStepClick = (targetStep: number) => {
    if (canNavigateToStep(targetStep)) {
      setStep(targetStep);
    }
  };

  const handleNext = () => {
    if (isCurrentStepValid()) {
      setCompletedSteps(new Set(completedSteps).add(step));
      nextStep();
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return <DestinationsStep />;
      case 1:
        return <DatesStep />;
      case 2:
        return <TravelersStep />;
      case 3:
        return <PreferencesStep />;
      case 4:
        return <TransportationStep />;
      case 5:
        return <BudgetStep />;
      default:
        return null;
    }
  };

  return (
    <>
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
        strategy="lazyOnload"
        onLoad={() => setScriptLoaded(true)}
      />
      <Box sx={{ px: 3, pt: 3 }}>
        <IconButton
          component={Link}
          href="/"
          onClick={handleBackClick}
          sx={{
            bgcolor: "rgba(11, 16, 32, 0.05)",
            "&:hover": {
              bgcolor: "rgba(11, 16, 32, 0.1)",
            },
          }}
        >
          <ArrowBackIcon />
        </IconButton>
      </Box>
      <Container maxWidth="md">
        <Box sx={{ my: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Create a New Trip
          </Typography>
          <Stepper activeStep={step} alternativeLabel sx={{ mb: 4 }}>
            {steps.map((label, index) => (
              <Step key={label}>
                <StepLabel
                  onClick={() => handleStepClick(index)}
                  sx={{
                    cursor: canNavigateToStep(index) ? "pointer" : "not-allowed",
                    opacity: canNavigateToStep(index) ? 1 : 0.5,
                  }}
                >
                  {label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>
          <Box sx={{ minHeight: "400px", display: "flex", flexDirection: "column" }}>
            <Box sx={{ flex: 1 }}>
              {step === 0 && !scriptLoaded ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                  <CircularProgress />
                </Box>
              ) : (
                renderStep()
              )}
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}>
              <Button disabled={step === 0} onClick={prevStep}>
                Back
              </Button>
              <Button
                variant="contained"
                onClick={step < steps.length - 1 ? handleNext : handleFinish}
                disabled={loading || !isCurrentStepValid()}
              >
                {step < steps.length - 1 ? (
                  "Next"
                ) : loading ? (
                  <CircularProgress size={24} />
                ) : (
                  "Finish"
                )}
              </Button>
            </Box>
          </Box>
        </Box>
      </Container>
    </>
  );
}
