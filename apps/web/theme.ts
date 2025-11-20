"use client";

import { createTheme } from "@mui/material/styles";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const theme = createTheme({
  typography: {
    fontFamily: inter.style.fontFamily,
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 600 },
    button: { fontWeight: 600, textTransform: "none" },
  },
  shape: {
    borderRadius: 12, // Default radius, specific cards can override to 28px
  },
  palette: {
    mode: "light",
    primary: {
      main: "#0070f3", // Brand Blue
    },
    text: {
      primary: "#0b1020",
      secondary: "rgba(11, 16, 32, 0.65)",
    },
    background: {
      default: "#f4f6fb",
      paper: "rgba(255, 255, 255, 0.94)",
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          minHeight: "100vh",
          background: `
            radial-gradient(circle at top, rgba(82, 140, 255, 0.2), transparent 55%),
            radial-gradient(circle at 85% 10%, rgba(125, 244, 195, 0.2), transparent 45%),
            #f4f6fb
          `,
          backgroundAttachment: "fixed", // Keeps gradient in place while scrolling
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 999, // Pill shape
          padding: "12px 24px",
          fontSize: "1rem",
          height: "52px",
          boxShadow: "none",
        },
        containedPrimary: {
          background: "linear-gradient(135deg, #0070f3, #005ae0)",
          boxShadow: "0 20px 35px rgba(0, 112, 243, 0.25)",
          "&:hover": {
            boxShadow: "0 25px 40px rgba(0, 112, 243, 0.35)",
            transform: "translateY(-1px)",
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 28,
          backdropFilter: "blur(18px)",
          border: "1px solid rgba(11, 16, 32, 0.08)",
          boxShadow: "0 24px 60px rgba(15, 23, 42, 0.15)",
          backgroundColor: "rgba(255, 255, 255, 0.8)",
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          backgroundColor: "transparent",
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(11, 16, 32, 0.15)",
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(11, 16, 32, 0.6)",
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(11, 16, 32, 0.6)",
            borderWidth: 1,
          },
        },
      },
    },
  },
});
