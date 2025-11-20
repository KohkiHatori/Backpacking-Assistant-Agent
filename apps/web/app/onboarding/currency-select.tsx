"use client";

import React, { useState, useEffect } from "react";
import Select from "react-select";

interface Currency {
  value: string;
  label: string;
  symbol: string;
  name: string;
}

export default function CurrencySelect({ defaultValue }: { defaultValue?: string }) {
  const [options, setOptions] = useState<Currency[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<string>(defaultValue || "USD");

  useEffect(() => {
    setIsLoading(true);
    // Fetch currencies from restcountries API
    // We fetch all countries and extract their currencies
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
                  symbol: details.symbol || "",
                  name: details.name,
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
      .finally(() => setIsLoading(false));
  }, []);

  // Custom styles to match your theme (reused from CitizenshipSelect)
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
        instanceId="currency-select"
        options={options}
        isLoading={isLoading}
        styles={customStyles}
        placeholder="Select currency..."
        defaultValue={
          defaultValue
            ? { label: defaultValue, value: defaultValue, symbol: "", name: "" } // Label will be updated when options load if we wanted to be perfect, but this is fine for initial render if we just match value
            : { label: "USD ($) - United States dollar", value: "USD", symbol: "$", name: "United States dollar" }
        }
        value={options.find(c => c.value === selectedCurrency)}
        required
        onChange={(newValue: any) => {
          setSelectedCurrency(newValue?.value || "");
        }}
      />
      <input type="hidden" name="currency" value={selectedCurrency} />
    </>
  );
}
