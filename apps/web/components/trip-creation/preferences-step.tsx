"use client";

import { useStore } from "@/lib/store";
import {
  Box,
  Typography,
  FormGroup,
  FormControlLabel,
  Checkbox,
} from "@mui/material";

const preferenceOptions = [
  "Adventure",
  "Relaxation",
  "Culture",
  "Food",
  "Nightlife",
  "Shopping",
  "Nature",
  "History",
];

export function PreferencesStep() {
  const { preferences, setField } = useStore();

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = event.target;
    const newPreferences = checked
      ? [...preferences, name]
      : preferences.filter((p) => p !== name);
    setField("preferences", newPreferences);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        What are your interests?
      </Typography>
      <FormGroup sx={{ display: "flex", flexDirection: "row" }}>
        {preferenceOptions.map((option) => (
          <FormControlLabel
            key={option}
            control={
              <Checkbox
                checked={preferences.includes(option)}
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
