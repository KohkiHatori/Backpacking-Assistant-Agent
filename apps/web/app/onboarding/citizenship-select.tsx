"use client";

import React, { useState, useEffect } from "react";
import Select from "react-select";

interface Country {
  value: string;
  label: string;
  cca2: string;
}

export default function CitizenshipSelect({ defaultValue }: { defaultValue?: string }) {
  const [options, setOptions] = useState<Country[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string>(defaultValue || "");

  useEffect(() => {
    setIsLoading(true);
    // Fetch countries from restcountries API
    fetch("https://restcountries.com/v3.1/all?fields=name,cca2")
      .then((res) => res.json())
      .then((data) => {
        const countries = data
          .map((country: any) => ({
            value: country.name.common, // Using common name as value since that's what we want to store probably, or ISO
            label: country.name.common,
            cca2: country.cca2
          }))
          .sort((a: Country, b: Country) => a.label.localeCompare(b.label));
        setOptions(countries);
      })
      .catch((err) => console.error("Failed to load countries", err))
      .finally(() => setIsLoading(false));
  }, []);

  // Custom styles to match your theme
  const customStyles = {
    control: (provided: any, state: any) => ({
      ...provided,
      height: "52px",
      borderRadius: "999px",
      border: "1px solid rgba(11, 16, 32, 0.15)",
      backgroundColor: "transparent",
      paddingLeft: "20px",
      fontSize: "1rem",
      fontWeight: "600",
      color: "#0b1020",
      boxShadow: state.isFocused ? "0 0 0 1px rgba(11, 16, 32, 0.6)" : "none",
      "&:hover": {
        borderColor: "rgba(11, 16, 32, 0.6)",
      },
    }),
    placeholder: (provided: any) => ({
      ...provided,
      color: "#757575",
      fontWeight: "400",
    }),
    singleValue: (provided: any) => ({
      ...provided,
      color: "#0b1020",
      fontWeight: "600",
    }),
    input: (provided: any) => ({
      ...provided,
      color: "#0b1020",
      fontWeight: "600",
    }),
    menu: (provided: any) => ({
      ...provided,
      borderRadius: "12px",
      overflow: "hidden",
      zIndex: 100,
    }),
    option: (provided: any, state: any) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? "#0070f3"
        : state.isFocused
        ? "rgba(0, 112, 243, 0.1)"
        : "white",
      color: state.isSelected ? "white" : "#0b1020",
      cursor: "pointer",
    }),
  };

  return (
    <>
      <Select
        instanceId="citizenship-select"
        options={options}
        isLoading={isLoading}
        styles={customStyles}
        placeholder="Select citizenship..."
        defaultValue={defaultValue ? { label: defaultValue, value: defaultValue, cca2: "" } : null}
        required
        onChange={(newValue: any) => {
          setSelectedCountry(newValue?.value || "");
        }}
      />
      <input type="hidden" name="citizenship" value={selectedCountry} />
    </>
  );
}
