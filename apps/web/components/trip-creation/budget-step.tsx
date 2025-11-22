"use client";

import { useStore } from "@/lib/store";
import { Box, Typography, TextField, InputAdornment } from "@mui/material";
import CurrencySelect from "@/components/currency-select";

const currencySymbols: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  CAD: "$",
  AUD: "$",
};

export function BudgetStep() {
  const { budget, currency, setField } = useStore();

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        What's your budget?
      </Typography>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <CurrencySelect
          value={currency}
          onChange={(value) => setField("currency", value)}
        />
        <TextField
          type="number"
          value={budget}
          onChange={(e) => setField("budget", parseInt(e.target.value, 10))}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                {currencySymbols[currency] || currency}
              </InputAdornment>
            ),
          }}
        />
      </Box>
    </Box>
  );
}
