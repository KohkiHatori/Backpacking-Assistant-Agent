"use client";

import { Card, CardActionArea, CardContent, Typography, Box, Chip } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import Link from "next/link";
import type { Trip } from "../lib/schemas";

interface TripCardProps {
  trip: Trip;
}

export default function TripCard({ trip }: TripCardProps) {
  const startDate = trip.start_date ? new Date(trip.start_date).toLocaleDateString() : "TBD";

  return (
    <Card sx={{ borderRadius: "24px", height: "100%", minHeight: "300px" }}>
      <CardActionArea
        LinkComponent={Link}
        href={`/trips/${trip.id}`}
        sx={{ height: "100%", p: 3, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'space-between' }}
      >
        <CardContent sx={{ p: 0, width: '100%' }}>
          <Typography variant="h4" component="h3" gutterBottom sx={{ fontWeight: 700, fontSize: "1.6rem" }}>
            {trip.name}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
            {startDate}
          </Typography>
        </CardContent>

        <Box sx={{ mt: 3, width: '100%' }}>
          {trip.destinations && trip.destinations.length > 0 ? (
            <Chip
              label={
                trip.destinations.length > 2
                  ? `${trip.destinations.slice(0, 2).join(", ")} +${trip.destinations.length - 2}`
                  : trip.destinations.join(", ")
              }
              sx={{ backgroundColor: "rgba(11, 16, 32, 0.05)", fontWeight: 600, fontSize: "0.95rem", py: 0.5 }}
            />
          ) : (
            <Typography variant="caption" color="text.disabled">No destinations</Typography>
          )}
        </Box>
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
        minHeight: "300px",
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
        sx={{ height: "100%", p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}
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
