import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "../../lib/auth";
import { submitOnboarding } from "./actions";
import CitizenshipSelect from "../../components/citizenship-select";
import CurrencySelect from "../../components/currency-select";
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Stack
} from "@mui/material";

export default async function OnboardingPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth");
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', py: { xs: 4, md: 12 } }}>
      <Container maxWidth="sm">
        <Card>
          <CardContent sx={{ p: { xs: 3, md: 5 } }}>
            <Box sx={{ mb: 4, textAlign: 'center' }}>
              <Typography variant="h4" component="h1" gutterBottom>
                Welcome! Let's get you set up.
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Tell us a bit about your preferences to help us plan your trips.
              </Typography>
            </Box>

            <form action={submitOnboarding}>
              <Stack spacing={3}>
                <TextField
                  label="Name"
                  name="name"
                  defaultValue={session.user?.name ?? ""}
                  required
                  fullWidth
                />

                <CitizenshipSelect defaultValue="" />

                <CurrencySelect defaultValue="USD" />

                <TextField
                  label="Dietary Restrictions"
                  name="food_dietary"
                  placeholder="e.g. Vegan, None"
                  fullWidth
                />

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  fullWidth
                  sx={{ mt: 2 }}
                >
                  Complete Setup
                </Button>
              </Stack>
            </form>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
