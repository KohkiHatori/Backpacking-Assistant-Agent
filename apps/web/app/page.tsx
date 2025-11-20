import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "../lib/auth";
import { getUserTrips } from "./actions";
import TripCard, { CreateTripCard } from "../components/trip-card";
import {
  AppBar,
  Toolbar,
  Typography,
  Avatar,
  Box,
  Container,
  Grid
} from "@mui/material";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/auth");
  }

  // @ts-expect-error - extending default session type
  const trips = await getUserTrips(session.user.id);

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
              src={session.user.image || undefined}
              alt={session.user.name || "User"}
              imgProps={{ referrerPolicy: "no-referrer" }}
              sx={{
                bgcolor: 'rgba(11, 16, 32, 0.05)',
                color: 'text.secondary',
                border: '1px solid',
                borderColor: 'rgba(11, 16, 32, 0.1)'
              }}
            >
              {(!session.user.image && (session.user.name?.[0] || session.user.email?.[0] || "U"))}
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
