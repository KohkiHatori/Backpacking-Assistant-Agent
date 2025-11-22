"use client";

import TripCard, { CreateTripCard } from "./trip-card";
import {
  AppBar,
  Toolbar,
  Typography,
  Avatar,
  Box,
  Container,
  Grid
} from "@mui/material";

interface DashboardProps {
  trips: any[];
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export default function Dashboard({ trips, user }: DashboardProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar
        position="sticky"
        color="inherit"
        elevation={0}
        sx={{
          borderBottom: '1px solid',
          borderColor: 'rgba(11, 16, 32, 0.08)',
          backdropFilter: 'blur(12px)',
          backgroundColor: 'rgba(255, 255, 255, 0.8)'
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, md: 4 } }}>
          <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: '-0.02em', textTransform: 'uppercase' }}>
            Backpacking Assistant
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              src={user.image || undefined}
              alt={user.name || "User"}
              imgProps={{ referrerPolicy: "no-referrer" }}
              sx={{
                bgcolor: 'rgba(11, 16, 32, 0.05)',
                color: 'text.secondary',
                border: '1px solid',
                borderColor: 'rgba(11, 16, 32, 0.1)'
              }}
            >
              {(!user.image && (user.name?.[0] || user.email?.[0] || "U"))}
            </Avatar>
          </Box>
        </Toolbar>
      </AppBar>

      <Container component="main" maxWidth="lg" sx={{ py: { xs: 4, md: 8 }, flex: 1 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" component="h1" sx={{ color: 'text.primary' }}>
            Your Trips
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {trips.map((trip) => (
            <Grid size={{ xs: 12, sm: 6 }} key={trip.id}>
              <TripCard trip={trip} />
            </Grid>
          ))}
          <Grid size={{ xs: 12, sm: 6 }}>
            <CreateTripCard />
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
