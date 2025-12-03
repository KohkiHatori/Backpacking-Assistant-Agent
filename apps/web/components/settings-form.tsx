"use client";

import { useState } from "react";
import { updateUserProfile } from "../app/settings/actions";
import CitizenshipSelect from "./citizenship-select";
import CurrencySelect from "./currency-select";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Stack,
  Alert,
  CircularProgress,
  Avatar,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import type { User } from "../lib/schemas";

interface SettingsFormProps {
  user: User;
}

export default function SettingsForm({ user }: SettingsFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await updateUserProfile(formData);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      {error && (
        <Alert
          severity="error"
          sx={{
            mb: 3,
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'error.light',
          }}
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      {success && (
        <Alert
          severity="success"
          sx={{
            mb: 3,
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'success.light',
          }}
          onClose={() => setSuccess(false)}
        >
          Settings updated successfully!
        </Alert>
      )}

      <Card
        sx={{
          borderRadius: 4,
          border: '1px solid',
          borderColor: 'rgba(11, 16, 32, 0.08)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.06)',
        }}
      >
        <CardContent sx={{ p: { xs: 3, md: 5 } }}>
          {/* User Avatar Header */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 3,
              mb: 5,
              pb: 4,
              borderBottom: '1px solid',
              borderColor: 'rgba(11, 16, 32, 0.08)',
            }}
          >
            <Avatar
              src={user.image || undefined}
              alt={user.name || "User"}
              sx={{
                width: 80,
                height: 80,
                bgcolor: 'rgba(11, 16, 32, 0.05)',
                color: 'text.primary',
                fontSize: '2rem',
                fontWeight: 700,
                border: '3px solid',
                borderColor: 'rgba(11, 16, 32, 0.1)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
              }}
            >
              {!user.image && (user.name?.[0] || user.email?.[0] || "U")}
            </Avatar>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                {user.name || "User"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {user.email}
              </Typography>
            </Box>
          </Box>

          <form action={handleSubmit}>
            <Stack spacing={5}>
              {/* Personal Information */}
              <Box>
                <Typography
                  variant="overline"
                  sx={{
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    color: 'text.secondary',
                    mb: 2,
                    display: 'block',
                  }}
                >
                  Personal Information
                </Typography>
                <Stack spacing={3}>
                  <TextField
                    label="Full Name"
                    name="name"
                    defaultValue={user.name || ""}
                    required
                    fullWidth
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      },
                    }}
                  />

                  <TextField
                    label="Email Address"
                    value={user.email || ""}
                    disabled
                    fullWidth
                    helperText="Your email address cannot be changed"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        bgcolor: 'rgba(11, 16, 32, 0.02)',
                      },
                    }}
                  />

                  <CitizenshipSelect defaultValue={user.citizenship || ""} />
                </Stack>
              </Box>

              {/* Preferences */}
              <Box>
                <Typography
                  variant="overline"
                  sx={{
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    color: 'text.secondary',
                    mb: 2,
                    display: 'block',
                  }}
                >
                  Travel Preferences
                </Typography>
                <Stack spacing={3}>
                  <CurrencySelect defaultValue={user.currency || "USD"} />

                  <TextField
                    label="Dietary Preferences"
                    name="food_dietary"
                    defaultValue={user.food_dietary || ""}
                    placeholder="e.g. Vegan, Gluten-Free, Kosher, Halal"
                    fullWidth
                    multiline
                    rows={3}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      },
                    }}
                  />
                </Stack>
              </Box>

              {/* Save Button */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  pt: 3,
                  borderTop: '1px solid',
                  borderColor: 'rgba(11, 16, 32, 0.08)',
                }}
              >
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                  disabled={loading}
                  sx={{
                    minWidth: 220,
                    borderRadius: 3,
                    py: 1.75,
                    px: 4,
                    fontSize: '1rem',
                    fontWeight: 600,
                    textTransform: 'none',
                    boxShadow: '0 4px 14px rgba(0, 112, 243, 0.3)',
                    background: 'linear-gradient(135deg, #0070f3 0%, #0052cc 100%)',
                    '&:hover': {
                      boxShadow: '0 6px 20px rgba(0, 112, 243, 0.4)',
                      transform: 'translateY(-1px)',
                      background: 'linear-gradient(135deg, #0052cc 0%, #0070f3 100%)',
                    },
                    '&:active': {
                      transform: 'translateY(0)',
                    },
                    transition: 'all 0.2s ease',
                  }}
                >
                  {loading ? "Saving Changes..." : "Save Changes"}
                </Button>
              </Box>
            </Stack>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
