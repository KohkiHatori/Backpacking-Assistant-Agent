"use client";

import { useStore } from "@/lib/store";
import {
  Box,
  Typography,
  FormGroup,
  FormControlLabel,
  Checkbox,
} from "@mui/material";

const transportationOptions = [
  "Plane",
  "Train",
  "Car",
  "Bus",
  "Boat",
  "Motorcycle",
  "Bicycle",
  "Walking",
];

export function TransportationStep() {
  const { transportation, setField } = useStore();

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = event.target;
    const newTransportation = checked
      ? [...transportation, name]
      : transportation.filter((t) => t !== name);
    setField("transportation", newTransportation);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        How do you want to get around?
      </Typography>
      <FormGroup sx={{ display: "flex", flexDirection: "row" }}>
        {transportationOptions.map((option) => (
          <FormControlLabel
            key={option}
            control={
              <Checkbox
                checked={transportation.includes(option)}
                onChange={handleChange}
                name={option}
              />
            }
            label={option}
          />
        ))}
      </FormGroup>
    </Box>
  );
}
