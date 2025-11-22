"use client";

import { useStore } from "@/lib/store";
import { Box, Typography, IconButton } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import GooglePlacesAutocomplete from "react-google-places-autocomplete";

export function DestinationsStep() {
  const { destinations, startPoint, endPoint, setField } = useStore();

  const addDestination = () => {
    setField("destinations", [...destinations, ""]);
  };

  const removeDestination = (index: number) => {
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
          Starting Point *
        </Typography>
        <GooglePlacesAutocomplete
          apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
          selectProps={{
            value: startPoint ? { label: startPoint, value: startPoint } : null,
            onChange: (newValue) => {
              setField("startPoint", newValue?.label || "");
            },
            placeholder: "Where are you starting from?",
            isClearable: true,
          }}
        />
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
          Destinations (Optional)
        </Typography>
        {destinations.map((destination, index) => (
          <Box key={index} sx={{ display: "flex", gap: 1, mb: 2, alignItems: "center" }}>
            <Box sx={{ flex: 1 }}>
              <GooglePlacesAutocomplete
                apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
                selectProps={{
                  value: destination ? { label: destination, value: destination } : null,
                  onChange: (newValue) => {
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
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        ))}
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
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
          Ending Point *
        </Typography>
        <GooglePlacesAutocomplete
          apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
          selectProps={{
            value: endPoint ? { label: endPoint, value: endPoint } : null,
            onChange: (newValue) => {
              setField("endPoint", newValue?.label || "");
            },
            placeholder: "Where will your trip end?",
            isClearable: true,
          }}
        />
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
  // Destinations are optional, but if any exist, they must all be filled
  return (
    startPoint.trim() !== "" &&
    endPoint.trim() !== "" &&
    destinations.every((d) => d.trim() !== "")
  );
}
