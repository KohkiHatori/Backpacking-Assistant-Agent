"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import {
  Box,
  Typography,
  Chip,
  TextField,
  IconButton,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";

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
  const [otherInput, setOtherInput] = useState("");
  const [customOptions, setCustomOptions] = useState<string[]>([]);

  const handleToggle = (option: string) => {
    if (preferences.includes(option)) {
      // If it's selected, deselect it
      setField("preferences", preferences.filter((p) => p !== option));
    } else {
      // If it's not selected, select it
      setField("preferences", [...preferences, option]);
    }
  };

  const handleRemove = (option: string) => {
    // Remove the option completely from both preferences and custom options
    setField("preferences", preferences.filter((p) => p !== option));
    setCustomOptions(customOptions.filter((o) => o !== option));
  };

  const handleAddOther = () => {
    const trimmedInput = otherInput.trim();
    if (trimmedInput && !customOptions.includes(trimmedInput) && !preferenceOptions.includes(trimmedInput)) {
      setCustomOptions([...customOptions, trimmedInput]);
      setField("preferences", [...preferences, trimmedInput]);
      setOtherInput("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAddOther();
    }
  };

  // Combine all options to display
  const allOptions = [...preferenceOptions, ...customOptions];

  return (
    <Box>
      <Typography variant="h6" gutterBottom textAlign="center">
        What are your interests?
      </Typography>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: 2,
          mt: 3,
          justifyItems: "center",
        }}
      >
        {allOptions.map((option) => {
          const isCustom = customOptions.includes(option);
          return (
            <Chip
              key={option}
              label={option}
              onClick={() => handleToggle(option)}
              onDelete={isCustom ? () => handleRemove(option) : undefined}
              deleteIcon={isCustom ? <CloseIcon fontSize="small" /> : undefined}
              color={preferences.includes(option) ? "primary" : "default"}
              variant={preferences.includes(option) ? "filled" : "outlined"}
              sx={{
                fontSize: "0.95rem",
                py: 2.5,
                px: 1,
                width: "100%",
                fontWeight: preferences.includes(option) ? 600 : 500,
                cursor: "pointer",
                transition: "all 0.2s",
                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: 2,
                },
                "& .MuiChip-deleteIcon": {
                  position: "absolute",
                  right: 8,
                  margin: 0,
                },
                "& .MuiChip-label": {
                  paddingRight: isCustom ? "32px" : "12px",
                },
              }}
            />
          );
        })}
      </Box>

      {/* Add other input */}
      <Box sx={{ mt: 3, display: "flex", justifyContent: "center", gap: 1 }}>
        <TextField
          size="small"
          placeholder="Add other interest..."
          value={otherInput}
          onChange={(e) => setOtherInput(e.target.value)}
          onKeyPress={handleKeyPress}
          sx={{ width: 250 }}
        />
        <IconButton
          color="primary"
          onClick={handleAddOther}
          disabled={!otherInput.trim()}
          sx={{
            border: "1px solid",
            borderColor: "primary.main",
            "&:hover": {
              backgroundColor: "primary.light",
            },
          }}
        >
          <AddIcon />
        </IconButton>
      </Box>
    </Box>
  );
}
