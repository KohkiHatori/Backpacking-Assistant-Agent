"use client";

import { Card, CardActionArea, CardContent, Typography, Box, Chip } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import Link from "next/link";
import type { Trip } from "../lib/schemas";

interface TripCardProps {
  trip: Trip;
}

export default function TripCard({ trip }: TripCardProps) {
  const formatDateRange = () => {
    if (!trip.start_date && !trip.end_date) {
      return "Dates TBD";
    }

    // Parse dates as local dates to avoid timezone issues
    const parseLocalDate = (dateString: string) => {
      const parts = dateString.split('-').map(Number);
      if (parts.length === 3 && parts.every(p => !isNaN(p))) {
        const year = parts[0]!;
        const month = parts[1]!;
        const day = parts[2]!;
        return new Date(year, month - 1, day).toLocaleDateString();
      }
      return "Invalid Date";
    };

    const startDate = trip.start_date ? parseLocalDate(trip.start_date) : "TBD";
    const endDate = trip.end_date ? parseLocalDate(trip.end_date) : "TBD";

    if (trip.start_date && trip.end_date) {
      return `${startDate} - ${endDate}`;
    }

    return startDate;
  };

  return (
    <Card sx={{ borderRadius: "24px", height: "100%", display: 'flex', flexDirection: 'column' }}>
      <CardActionArea
        LinkComponent={Link}
        href={`/trip/${trip.id}`}
        sx={{ height: "100%", p: 3, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-start' }}
      >
        <CardContent sx={{ p: 0, width: '100%', flex: 1 }}>
          <Typography variant="h4" component="h3" gutterBottom sx={{ fontWeight: 700, fontSize: "1.6rem" }}>
            {trip.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, mb: 1 }}>
            {formatDateRange()}
          </Typography>
          {trip.description && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2, lineHeight: 1.6 }}>
              {trip.description}
            </Typography>
          )}
          {trip.destinations && trip.destinations.length > 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2, lineHeight: 1.6 }}>
              <strong>Destinations:</strong> {trip.destinations.join(" • ")}
            </Typography>
          )}
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

export function CreateTripCard() {
  return (
    <Card
      sx={{
        borderRadius: "24px",
        height: "100%",
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: "transparent",
        border: "2px dashed rgba(11, 16, 32, 0.12)",
        boxShadow: "none",
        backdropFilter: "none",
        "&:hover": {
          borderColor: "primary.main",
          backgroundColor: "rgba(0, 112, 243, 0.04)",
        }
      }}
    >
      <CardActionArea
        LinkComponent={Link}
        href="/trip/create"
        sx={{ height: "100%", p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, flex: 1 }}
      >
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            bgcolor: "rgba(11, 16, 32, 0.05)",
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: "all 0.2s",
            ".MuiButtonBase-root:hover &": {
              bgcolor: "rgba(0, 112, 243, 0.1)",
              transform: "scale(1.1)"
            }
          }}
        >
          <AddIcon sx={{ fontSize: 32, color: "text.secondary", ".MuiButtonBase-root:hover &": { color: "primary.main" } }} />
        </Box>
        <Typography variant="h5" color="text.secondary" sx={{ fontWeight: 600, ".MuiButtonBase-root:hover &": { color: "primary.main" } }}>
          Plan new trip
        </Typography>
      </CardActionArea>
    </Card>
  );
}
