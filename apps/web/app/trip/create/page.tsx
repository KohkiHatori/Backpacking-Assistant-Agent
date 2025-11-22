"use client";

import { useState } from "react";
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
} from "@mui/material";
import { DestinationsStep, isDestinationsStepValid } from "@/components/trip-creation/destinations-step";
import { DatesStep } from "@/components/trip-creation/dates-step";
import { PreferencesStep } from "@/components/trip-creation/preferences-step";
import { TransportationStep } from "@/components/trip-creation/transportation-step";
import { BudgetStep } from "@/components/trip-creation/budget-step";
import { createTrip } from "./actions";
import { useRouter } from "next/navigation";

const steps = [
  "Destinations",
  "Dates",
  "Preferences",
  "Transportation",
  "Budget",
];

export default function CreateTripPage() {
  const store = useStore();
  const { step, nextStep, prevStep, setStep } = store;
  const router = useRouter();
  const [loading, setLoading] = useState(false);

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
        preferences: store.preferences,
        transportation: store.transportation,
        budget: store.budget,
        currency: store.currency,
      };
      await createTrip(tripData);
      router.push("/");
    } catch (error) {
      console.error("Failed to create trip:", error);
      // Handle error state in UI
    } finally {
      setLoading(false);
    }
  };

  const isCurrentStepValid = (): boolean => {
    switch (step) {
      case 0:
        return isDestinationsStepValid(
          store.startPoint,
          store.destinations,
          store.endPoint
        );
      default:
        return true;
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return <DestinationsStep />;
      case 1:
        return <DatesStep />;
      case 2:
        return <PreferencesStep />;
      case 3:
        return <TransportationStep />;
      case 4:
        return <BudgetStep />;
      default:
        return null;
    }
  };

  return (
    <>
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
        strategy="beforeInteractive"
      />
      <Container maxWidth="md">
        <Box sx={{ my: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Create a New Trip
          </Typography>
          <Stepper activeStep={step} alternativeLabel sx={{ mb: 4 }}>
            {steps.map((label, index) => (
              <Step key={label}>
                <StepLabel onClick={() => setStep(index)}>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          <Box>{renderStep()}</Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}>
            <Button disabled={step === 0} onClick={prevStep}>
              Back
            </Button>
            <Button
              variant="contained"
              onClick={step < steps.length - 1 ? nextStep : handleFinish}
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
      </Container>
    </>
  );
}
