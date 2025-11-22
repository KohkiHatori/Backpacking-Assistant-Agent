"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Switch,
  FormControlLabel,
  Paper,
} from "@mui/material";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DateRangePicker } from "@mui/x-date-pickers-pro/DateRangePicker";
import { SingleInputDateRangeField } from "@mui/x-date-pickers-pro/SingleInputDateRangeField";

export function DatesStep() {
  const { startDate, endDate, flexibleDates, setField } = useStore();
  const [tab, setTab] = useState(0);

  const handleDateRangeChange = (newValue: [Date | null, Date | null]) => {
    const [start, end] = newValue;
    setField("startDate", start);
    setField("endDate", end);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        When are you traveling?
      </Typography>
      <Tabs value={tab} onChange={(e, newValue) => setTab(newValue)} centered>
        <Tab label="Specific Dates" />
        <Tab label="Flexible Dates" />
      </Tabs>
      {tab === 0 && (
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
      )}
      {tab === 1 && (
        <Box sx={{ mt: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={flexibleDates}
                onChange={(e) => setField("flexibleDates", e.target.checked)}
              />
            }
            label="Dates are flexible"
          />
        </Box>
      )}
    </Box>
  );
}
