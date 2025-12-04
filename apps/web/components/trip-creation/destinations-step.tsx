"use client";

import { useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import { Box, Typography, IconButton, FormControlLabel, Checkbox } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import GooglePlacesAutocomplete from "react-google-places-autocomplete";

export function DestinationsStep() {
  const { destinations, startPoint, endPoint, setField } = useStore();
  const [differentEndPoint, setDifferentEndPoint] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Initialize on mount
  useEffect(() => {
    if (!initialized) {
      // Check if endPoint is different from startPoint
      if (endPoint && startPoint && endPoint !== startPoint) {
        setDifferentEndPoint(true);
      }

      // Ensure there's at least one destination when start and end are the same
      if (!differentEndPoint && destinations.length === 0) {
        setField("destinations", [""]);
      }

      setInitialized(true);
    }
  }, []);

  // Ensure there's at least one destination when start and end are the same (after initialization)
  useEffect(() => {
    if (initialized && !differentEndPoint && destinations.length === 0) {
      setField("destinations", [""]);
    }
  }, [initialized, differentEndPoint, destinations.length, setField]);

  // When checkbox changes, update endPoint and destinations accordingly
  const handleCheckboxChange = (checked: boolean) => {
    setDifferentEndPoint(checked);
    if (!checked) {
      // If unchecked, set endPoint same as startPoint
      setField("endPoint", startPoint);
      // Ensure at least one destination exists
      if (destinations.length === 0) {
        setField("destinations", [""]);
      }
    } else {
      // If checked, clear endPoint so user can enter a different one
      setField("endPoint", "");
    }
  };

  // When startPoint changes and differentEndPoint is false, update endPoint to match
  useEffect(() => {
    if (!differentEndPoint && startPoint) {
      setField("endPoint", startPoint);
    }
  }, [startPoint, differentEndPoint, setField]);

  const addDestination = () => {
    setField("destinations", [...destinations, ""]);
  };

  const removeDestination = (index: number) => {
    // Don't allow removing the first destination if start and end are the same
    if (!differentEndPoint && index === 0 && destinations.length === 1) {
      return;
    }
    const newDestinations = destinations.filter((_, i) => i !== index);
    setField("destinations", newDestinations);
  };

  const updateDestination = (index: number, value: string) => {
    const newDestinations = [...destinations];
    newDestinations[index] = value;
    setField("destinations", newDestinations);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Where do you want to go?
      </Typography>

      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
          Start Location {!differentEndPoint && "& End Location"} *
        </Typography>
        <GooglePlacesAutocomplete
          apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
          autocompletionRequest={{
            types: ['(cities)']
          }}
          selectProps={{
            value: startPoint ? { label: startPoint, value: startPoint } : null,
            onChange: (newValue: any) => {
              setField("startPoint", newValue?.label || "");
            },
            placeholder: differentEndPoint ? "Where does your trip start?" : "Where does your trip start and end?",
            isClearable: true,
          }}
        />
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
          Destinations {!differentEndPoint ? "*" : "(Optional)"}
        </Typography>
        {destinations.map((destination, index) => {
          const isFirstAndRequired = !differentEndPoint && index === 0;
          return (
            <Box key={index} sx={{ display: "flex", gap: 1, mb: 2, alignItems: "center" }}>
              <Box sx={{ flex: 1 }}>
                <GooglePlacesAutocomplete
                  apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
                  autocompletionRequest={{
                    types: ['(cities)']
                  }}
                  selectProps={{
                    value: destination ? { label: destination, value: destination } : null,
                    onChange: (newValue: any) => {
                      updateDestination(index, newValue?.label || "");
                    },
                    placeholder: `Destination ${index + 1}`,
                    isClearable: true,
                  }}
                />
              </Box>
              <IconButton
                onClick={() => removeDestination(index)}
                color="error"
                size="small"
                disabled={isFirstAndRequired && destinations.length === 1}
                sx={{
                  opacity: isFirstAndRequired && destinations.length === 1 ? 0.3 : 1,
                  cursor: isFirstAndRequired && destinations.length === 1 ? "not-allowed" : "pointer",
                }}
              >
                <DeleteIcon />
              </IconButton>
            </Box>
          );
        })}
        <IconButton
          onClick={addDestination}
          color="primary"
          sx={{
            border: "2px dashed",
            borderColor: "primary.main",
            borderRadius: 2,
            width: "100%",
            py: 1,
          }}
        >
          <AddIcon />
          <Typography variant="body2" sx={{ ml: 1 }}>
            Add Destination
          </Typography>
        </IconButton>
      </Box>

      <Box>
        <FormControlLabel
          control={
            <Checkbox
              checked={differentEndPoint}
              onChange={(e) => handleCheckboxChange(e.target.checked)}
            />
          }
          label="My trip ends at a different location"
          sx={{ mb: 2 }}
        />

        {differentEndPoint && (
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              End Location *
            </Typography>
            <GooglePlacesAutocomplete
              apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
              autocompletionRequest={{
                types: ['(cities)']
              }}
              selectProps={{
                value: endPoint ? { label: endPoint, value: endPoint } : null,
                onChange: (newValue: any) => {
                  setField("endPoint", newValue?.label || "");
                },
                placeholder: "Where does your trip end?",
                isClearable: true,
              }}
            />
          </Box>
        )}
      </Box>
    </Box>
  );
}

export function isDestinationsStepValid(
  startPoint: string,
  destinations: string[],
  endPoint: string
): boolean {
  // Starting point and ending point are required
  if (startPoint.trim() === "" || endPoint.trim() === "") {
    return false;
  }

  // All destinations must be filled (no empty strings)
  if (!destinations.every((d) => d.trim() !== "")) {
    return false;
  }

  // If start and end locations are the same, at least one destination is required
  if (startPoint.trim() === endPoint.trim()) {
    return destinations.length > 0 && destinations.every((d) => d.trim() !== "");
  }

  return true;
}
