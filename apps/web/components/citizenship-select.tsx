"use client";

import React, { useState, useEffect } from "react";
import { Autocomplete, TextField, CircularProgress } from "@mui/material";

interface Country {
  label: string;
  value: string;
  cca2: string;
}

export default function CitizenshipSelect({ defaultValue }: { defaultValue?: string }) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<Country[]>([]);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [value, setValue] = useState<Country | null>(
    defaultValue ? { label: defaultValue, value: defaultValue, cca2: "" } : null
  );

  useEffect(() => {
    if (!open || options.length > 0) {
      return;
    }

    setLoading(true);
    fetch("https://restcountries.com/v3.1/all?fields=name,cca2")
      .then((res) => res.json())
      .then((data) => {
        const countries = data
          .map((country: any) => ({
            label: country.name.common,
            value: country.name.common,
            cca2: country.cca2,
          }))
          .sort((a: Country, b: Country) => a.label.localeCompare(b.label));
        setOptions(countries);
      })
      .catch((err) => console.error("Failed to load countries", err))
      .finally(() => setLoading(false));
  }, [open, options.length]);

  return (
    <>
      <Autocomplete
        id="citizenship-select"
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
        }}
        inputValue={inputValue}
        onInputChange={(event, newInputValue) => {
          setInputValue(newInputValue);
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Citizenship"
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
      <input type="hidden" name="citizenship" value={value?.value || ""} />
    </>
  );
}
