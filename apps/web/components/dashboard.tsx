"use client";

import TripCard, { CreateTripCard } from "./trip-card";
import {
  AppBar,
  Toolbar,
  Typography,
  Avatar,
  Box,
  Container,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Divider,
  CircularProgress
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import { Settings, Logout } from "@mui/icons-material";
import { signOut } from "next-auth/react";
import { useState } from "react";

import { createTestTrip } from "@/app/debug-actions";

interface DashboardProps {
  trips: any[];
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export default function Dashboard({ trips, user }: DashboardProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const [isCreatingTest, setIsCreatingTest] = useState(false);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleClose();
    await signOut({ callbackUrl: '/auth' });
  };

  const handleSettings = () => {
    handleClose();
    window.location.href = '/settings';
  };

  const handleCreateTestTrip = async () => {
    setIsCreatingTest(true);
    const result = await createTestTrip();
    setIsCreatingTest(false);
    if (result.success && result.tripId) {
      window.location.href = `/trip/${result.tripId}`;
    }
  };

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
            <IconButton
              onClick={handleClick}
              aria-controls={open ? 'user-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={open ? 'true' : undefined}
            >
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
            </IconButton>
            <Menu
              id="user-menu"
              anchorEl={anchorEl}
              open={open}
              onClose={handleClose}
              onClick={handleClose}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              slotProps={{
                paper: {
                  elevation: 0,
                  sx: {
                    overflow: 'visible',
                    filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.12))',
                    mt: 1.5,
                    minWidth: 180,
                    '&::before': {
                      content: '""',
                      display: 'block',
                      position: 'absolute',
                      top: 0,
                      right: 14,
                      width: 10,
                      height: 10,
                      bgcolor: 'background.paper',
                      transform: 'translateY(-50%) rotate(45deg)',
                      zIndex: 0,
                    },
                  },
                },
              }}
            >
              <MenuItem onClick={handleSettings}>
                <ListItemIcon>
                  <Settings fontSize="small" />
                </ListItemIcon>
                <ListItemText>Settings</ListItemText>
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <Logout fontSize="small" />
                </ListItemIcon>
                <ListItemText>Logout</ListItemText>
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      <Container component="main" maxWidth="lg" sx={{ py: { xs: 2, md: 4 }, flex: 1 }}>
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h3" component="h1" sx={{ color: 'text.primary' }}>
            Your Trips
          </Typography>
          {process.env.NODE_ENV === 'development' && (
            <IconButton onClick={handleCreateTestTrip} disabled={isCreatingTest} color="primary" title="Create Test Trip">
              {isCreatingTest ? <CircularProgress size={24} /> : <Typography variant="caption" sx={{ border: '1px dashed', p: 1 }}>+ Test Trip</Typography>}
            </IconButton>
          )}
        </Box>

        <Grid container spacing={3}>
          {trips.map((trip) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={trip.id}>
              <TripCard trip={trip} />
            </Grid>
          ))}
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <CreateTripCard />
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
