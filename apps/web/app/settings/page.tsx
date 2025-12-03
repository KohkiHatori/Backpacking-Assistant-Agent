import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "../../lib/auth";
import { getUserProfile } from "./actions";
import SettingsForm from "../../components/settings-form";
import {
  Box,
  Container,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Link from "next/link";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/auth");
  }

  const userProfile = await getUserProfile(session.user.email!);

  // If onboarding not completed, redirect to onboarding
  if (!userProfile.onboarding_completed) {
    redirect("/onboarding");
  }

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
            Settings
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ py: { xs: 4, md: 6 }, flex: 1 }}>
        <SettingsForm user={userProfile} />
      </Container>
    </Box>
  );
}
