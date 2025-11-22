"use client";

import React, { useState, useEffect } from "react";
import { Autocomplete, TextField, CircularProgress } from "@mui/material";

interface Currency {
  label: string;
  value: string;
}

interface CurrencySelectProps {
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
}

export default function CurrencySelect({ defaultValue, value: controlledValue, onChange }: CurrencySelectProps) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(false);
  const [value, setValue] = useState<Currency | null>(
    defaultValue ? { label: defaultValue, value: defaultValue } : null
  );

  // Sync internal value with controlled value if provided
  useEffect(() => {
    if (controlledValue) {
      setValue({ label: controlledValue, value: controlledValue });
    }
  }, [controlledValue]);

  useEffect(() => {
    if (!open || options.length > 0) {
      return;
    }

    setLoading(true);
    fetch("https://restcountries.com/v3.1/all?fields=currencies")
      .then((res) => res.json())
      .then((data) => {
        const currencyMap = new Map<string, Currency>();

        data.forEach((country: any) => {
          if (country.currencies) {
            Object.entries(country.currencies).forEach(([code, details]: [string, any]) => {
              if (!currencyMap.has(code)) {
                currencyMap.set(code, {
                  value: code,
                  label: `${code} (${details.symbol || ""}) - ${details.name}`,
                });
              }
            });
          }
        });

        const sortedCurrencies = Array.from(currencyMap.values()).sort((a, b) =>
          a.value.localeCompare(b.value)
        );

        setOptions(sortedCurrencies);
      })
      .catch((err) => console.error("Failed to load currencies", err))
      .finally(() => setLoading(false));
  }, [open, options.length]);

  return (
    <>
      <Autocomplete
        id="currency-select"
        open={open}
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
        isOptionEqualToValue={(option, value) => option.value === value.value}
        getOptionLabel={(option) => option.label}
        options={options}
        loading={loading}
        value={value}
        onChange={(event, newValue) => {
          setValue(newValue);
          if (onChange && newValue) {
            onChange(newValue.value);
          }
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Preferred Currency"
            required
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <React.Fragment>
                  {loading ? <CircularProgress color="inherit" size={20} /> : null}
                  {params.InputProps.endAdornment}
                </React.Fragment>
              ),
            }}
          />
        )}
      />
      <input type="hidden" name="currency" value={value?.value || "USD"} />
    </>
  );
}
