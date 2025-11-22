"use client";

import { useEffect } from "react";
import { useStore } from "@/lib/store";
import {
  Box,
  Typography,
} from "@mui/material";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DateRangePicker } from "@mui/x-date-pickers-pro/DateRangePicker";
import { SingleInputDateRangeField } from "@mui/x-date-pickers-pro/SingleInputDateRangeField";

export function DatesStep() {
  const { startDate, endDate, setField } = useStore();

  // Ensure flexibleDates is always false
  useEffect(() => {
    setField("flexibleDates", false);
  }, [setField]);

  const handleDateRangeChange = (newValue: [Date | null, Date | null]) => {
    const [start, end] = newValue;
    setField("startDate", start);
    setField("endDate", end);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom textAlign="center">
        When are you traveling?
      </Typography>
      <Box sx={{ mt: 3 }}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DateRangePicker
            value={[startDate, endDate]}
            onChange={handleDateRangeChange}
            slots={{
              field: SingleInputDateRangeField,
            }}
            slotProps={{
              textField: {
                fullWidth: true,
                helperText: "Select your start and end dates",
              },
            }}
          />
        </LocalizationProvider>
      </Box>
    </Box>
  );
}
