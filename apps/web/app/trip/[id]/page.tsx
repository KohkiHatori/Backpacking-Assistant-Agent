import { notFound } from "next/navigation";
import { getTrip, getItineraryItems, getTasks } from "./actions";
import TripView from "@/components/trip-view";
import { Container, Box, AppBar, Toolbar, IconButton, Typography } from "@mui/material";
import Link from "next/link";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

interface TripPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function TripPage({ params }: TripPageProps) {
  const { id } = await params;
  const trip = await getTrip(id);

  if (!trip) {
    notFound();
  }

  const itineraryItems = await getItineraryItems(id);
  const tasks = await getTasks(id);

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
        <Toolbar sx={{ px: { xs: 2, md: 4 } }}>
          <IconButton
            component={Link}
            href="/"
            sx={{
              mr: 2,
              bgcolor: "rgba(11, 16, 32, 0.05)",
              "&:hover": {
                bgcolor: "rgba(11, 16, 32, 0.1)",
              },
            }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: '-0.02em' }}>
            {trip.name}
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4, flex: 1 }}>
        <TripView trip={trip} itineraryItems={itineraryItems} tasks={tasks} />
      </Container>

    </Box>
  );
}
