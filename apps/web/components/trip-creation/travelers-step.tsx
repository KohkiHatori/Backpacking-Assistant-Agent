"use client";

import { useStore } from "@/lib/store";
import { Box, Typography, TextField, IconButton } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";

export function TravelersStep() {
  const { adultsCount, childrenCount, setField } = useStore();

  const handleIncrement = (field: "adultsCount" | "childrenCount") => {
    const currentValue = field === "adultsCount" ? adultsCount : childrenCount;
    setField(field, currentValue + 1);
  };

  const handleDecrement = (field: "adultsCount" | "childrenCount") => {
    const currentValue = field === "adultsCount" ? adultsCount : childrenCount;
    const minValue = field === "adultsCount" ? 1 : 0; // At least 1 adult required
    if (currentValue > minValue) {
      setField(field, currentValue - 1);
    }
  };

  const totalTravelers = adultsCount + childrenCount;

  return (
    <Box sx={{ textAlign: "center" }}>
      <Typography variant="h6" gutterBottom>
        How many people are traveling?
      </Typography>

      <Box sx={{ mt: 4, maxWidth: 400, mx: "auto" }}>
        {/* Adults */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 3,
            p: 2,
            border: "1px solid",
            borderColor: "rgba(11, 16, 32, 0.12)",
            borderRadius: 2,
          }}
        >
          <Box sx={{ textAlign: "left" }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Adults
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Age 18+
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <IconButton
              onClick={() => handleDecrement("adultsCount")}
              disabled={adultsCount <= 1}
              sx={{
                border: "1px solid",
                borderColor: "rgba(11, 16, 32, 0.12)",
              }}
            >
              <RemoveIcon />
            </IconButton>
            <Typography variant="h6" sx={{ minWidth: 40, textAlign: "center" }}>
              {adultsCount}
            </Typography>
            <IconButton
              onClick={() => handleIncrement("adultsCount")}
              sx={{
                border: "1px solid",
                borderColor: "rgba(11, 16, 32, 0.12)",
              }}
            >
              <AddIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Children */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            p: 2,
            border: "1px solid",
            borderColor: "rgba(11, 16, 32, 0.12)",
            borderRadius: 2,
          }}
        >
          <Box sx={{ textAlign: "left" }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Children
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Age 0-17
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <IconButton
              onClick={() => handleDecrement("childrenCount")}
              disabled={childrenCount <= 0}
              sx={{
                border: "1px solid",
                borderColor: "rgba(11, 16, 32, 0.12)",
              }}
            >
              <RemoveIcon />
            </IconButton>
            <Typography variant="h6" sx={{ minWidth: 40, textAlign: "center" }}>
              {childrenCount}
            </Typography>
            <IconButton
              onClick={() => handleIncrement("childrenCount")}
              sx={{
                border: "1px solid",
                borderColor: "rgba(11, 16, 32, 0.12)",
              }}
            >
              <AddIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Total */}
        <Box sx={{ mt: 3, p: 2, bgcolor: "rgba(0, 112, 243, 0.04)", borderRadius: 2 }}>
          <Typography variant="body1" color="primary" sx={{ fontWeight: 600 }}>
            Total: {totalTravelers} {totalTravelers === 1 ? "traveler" : "travelers"}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
