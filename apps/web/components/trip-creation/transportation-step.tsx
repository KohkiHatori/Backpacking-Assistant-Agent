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
  const [otherInput, setOtherInput] = useState("");
  const [customOptions, setCustomOptions] = useState<string[]>([]);

  const handleToggle = (option: string) => {
    if (transportation.includes(option)) {
      // If it's selected, deselect it
      setField("transportation", transportation.filter((t) => t !== option));
    } else {
      // If it's not selected, select it
      setField("transportation", [...transportation, option]);
    }
  };

  const handleRemove = (option: string) => {
    // Remove the option completely from both transportation and custom options
    setField("transportation", transportation.filter((t) => t !== option));
    setCustomOptions(customOptions.filter((o) => o !== option));
  };

  const handleAddOther = () => {
    const trimmedInput = otherInput.trim();
    if (trimmedInput && !customOptions.includes(trimmedInput) && !transportationOptions.includes(trimmedInput)) {
      setCustomOptions([...customOptions, trimmedInput]);
      setField("transportation", [...transportation, trimmedInput]);
      setOtherInput("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAddOther();
    }
  };

  // Combine all options to display
  const allOptions = [...transportationOptions, ...customOptions];

  return (
    <Box>
      <Typography variant="h6" gutterBottom textAlign="center">
        How do you want to get around?
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
              color={transportation.includes(option) ? "primary" : "default"}
              variant={transportation.includes(option) ? "filled" : "outlined"}
              sx={{
                fontSize: "0.95rem",
                py: 2.5,
                px: 1,
                width: "100%",
                fontWeight: transportation.includes(option) ? 600 : 500,
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
          placeholder="Add other transportation..."
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
