import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";
import { GoogleSignInButton, SignOutButton } from "../../components/auth-buttons";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Container,
  Link
} from "@mui/material";

interface AuthPageProps {
  searchParams?: {
    from?: string;
    callbackUrl?: string;
  };
}

export default async function AuthPage({ searchParams }: AuthPageProps) {
  const session = await getServerSession(authOptions);
  const callbackUrl = searchParams?.callbackUrl ?? searchParams?.from ?? "/";
  const year = new Date().getFullYear();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', p: { xs: 3, md: 12 }, gap: 8 }}>
      <Container component="main" maxWidth="lg" sx={{ display: 'grid', gridTemplateColumns: { md: '1fr 1fr' }, gap: 8, alignItems: 'center' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Typography variant="overline" sx={{ letterSpacing: '0.18em', fontWeight: 600, bgcolor: 'rgba(11, 16, 32, 0.05)', px: 2, py: 1, borderRadius: 99, alignSelf: 'flex-start', border: '1px solid rgba(11, 16, 32, 0.1)' }}>
            Backpacking Assistant
          </Typography>
          <Typography variant="h1" sx={{ fontSize: { xs: '2.4rem', md: '3.8rem' }, lineHeight: 1.05 }}>
            Secure your gear and get back to the trail
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.05rem', lineHeight: 1.7, maxWidth: '48ch' }}>
            {session
              ? "You're signed in. Manage your account or sign out here."
              : "Sign in to sync your checklists, permits, and packing iterations across devices."}
          </Typography>
        </Box>

        <Card>
          <CardContent sx={{ p: { xs: 3, md: 5 }, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box>
              <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: '0.2em' }}>
                {session ? "Account" : "Welcome back"}
              </Typography>
              <Typography variant="h4" component="h2" gutterBottom>
                {session
                  ? `Signed in as ${session.user?.name ?? session.user?.email ?? "Unknown user"}`
                  : "Access your pack in seconds"}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                {session
                  ? "You can now access all your synchronized trip data."
                  : "Use your Google account to keep every route, checklist, and insight safely in one place."}
              </Typography>
            </Box>

            <Box>
              {session ? (
                <SignOutButton />
              ) : (
                <GoogleSignInButton callbackUrl={callbackUrl} />
              )}
            </Box>
          </CardContent>
        </Card>
      </Container>

      <Box component="footer" sx={{ mt: 'auto', display: 'flex', justifyContent: 'space-between', color: 'text.secondary', fontSize: '0.85rem', px: 2 }}>
        <Typography variant="body2" color="inherit">
          © {year} Backpacking Assistant
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Link href="mailto:privacy@backpackingassistant.app" color="inherit" underline="hover">Privacy</Link>
          <Link href="mailto:legal@backpackingassistant.app" color="inherit" underline="hover">Terms</Link>
        </Box>
      </Box>
    </Box>
  );
}
