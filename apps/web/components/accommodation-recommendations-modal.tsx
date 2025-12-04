'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Divider,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import HotelIcon from '@mui/icons-material/Hotel';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';

interface AccommodationRecommendation {
  destination: string;
  name: string;
  type: string;
  price_per_night: number;
  currency: string;
  total_cost: number;
  nights_count: number;
  location: string;
  description: string;
  why_fits: string;
  range_category: string;
}

interface AccommodationRecommendationsModalProps {
  open: boolean;
  onClose: () => void;
  tripId: string;
  destination: string;
  nightsCount: number;
}

export default function AccommodationRecommendationsModal({
  open,
  onClose,
  tripId,
  destination,
  nightsCount,
}: AccommodationRecommendationsModalProps) {
  const [recommendations, setRecommendations] = useState<AccommodationRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Load recommendations when modal opens
  useEffect(() => {
    if (open && !hasLoaded) {
      loadRecommendations();
    }
  }, [open, hasLoaded]);

  const loadRecommendations = async () => {
    setLoading(true);
    setError(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/accommodations/recommend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          destination,
          trip_id: tripId,
          nights_count: nightsCount,
          range_type: 'all',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get recommendations');
      }

      const data = await response.json();
      setRecommendations(data.recommendations || []);
      setHasLoaded(true);
    } catch (err: any) {
      setError(err.message || 'Failed to load accommodation recommendations');
      console.error('Error loading recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'budget':
        return 'success';
      case 'mid-range':
        return 'primary';
      case 'luxury':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'budget':
        return '💰';
      case 'mid-range':
        return '⭐';
      case 'luxury':
        return '👑';
      default:
        return '🏨';
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <HotelIcon color="primary" />
            <Typography variant="h6" component="span">
              Accommodation Recommendations
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {destination} • {nightsCount} {nightsCount === 1 ? 'night' : 'nights'}
        </Typography>
      </DialogTitle>

      <DialogContent dividers sx={{ px: 3, py: 3 }}>
        {loading && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 6 }}>
            <CircularProgress size={40} sx={{ mb: 2 }} />
            <Typography variant="body2" color="text.secondary">
              Searching for the best accommodations...
            </Typography>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {!loading && !error && recommendations.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="body1" color="text.secondary">
              No recommendations available
            </Typography>
          </Box>
        )}

        {!loading && recommendations.length > 0 &&
         recommendations.filter((rec) => rec.name && rec.name.length > 5 && rec.price_per_night > 0).length === 0 && (
          <Alert severity="warning">
            Unable to generate valid recommendations. Please try again or use the chat assistant for personalized suggestions.
          </Alert>
        )}

        {!loading && recommendations.length > 0 &&
         recommendations.filter((rec) => rec.name && rec.name.length > 5 && rec.price_per_night > 0).length > 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {recommendations
              .filter((rec) => rec.name && rec.name.length > 5 && rec.price_per_night > 0)
              .map((rec, index) => (
              <Card
                key={index}
                variant="outlined"
                sx={{
                  borderRadius: 2,
                  transition: 'all 0.2s',
                  '&:hover': {
                    boxShadow: 2,
                    borderColor: 'primary.main',
                  },
                }}
              >
                <CardContent>
                  {/* Header */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1.5, gap: 2 }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="h6" component="div" sx={{ mb: 1, wordBreak: 'break-word' }}>
                        {getCategoryIcon(rec.range_category)} {rec.name}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Chip
                          label={rec.range_category}
                          size="small"
                          color={getCategoryColor(rec.range_category) as any}
                        />
                        {rec.type && rec.type !== 'hotel' && (
                          <Chip label={rec.type} size="small" variant="outlined" />
                        )}
                      </Box>
                    </Box>
                    <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                      <Typography variant="h6" color="primary" sx={{ whiteSpace: 'nowrap' }}>
                        {rec.currency} {rec.price_per_night}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        per night
                      </Typography>
                    </Box>
                  </Box>

                  <Divider sx={{ my: 1.5 }} />

                  {/* Location */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1.5 }}>
                    <LocationOnIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {rec.location}
                    </Typography>
                  </Box>

                  {/* Description */}
                  {rec.description && (
                    <Typography variant="body2" sx={{ mb: 1.5, lineHeight: 1.6 }}>
                      {rec.description}
                    </Typography>
                  )}

                  {/* Why it fits */}
                  {rec.why_fits && (
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 1,
                        bgcolor: 'rgba(25, 118, 210, 0.08)',
                        border: '1px solid rgba(25, 118, 210, 0.2)',
                      }}
                    >
                      <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                        Why this fits:
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {rec.why_fits}
                      </Typography>
                    </Box>
                  )}

                  {/* Total cost */}
                  <Box
                    sx={{
                      mt: 1.5,
                      pt: 1.5,
                      borderTop: '1px solid',
                      borderColor: 'divider',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Total for {rec.nights_count} {rec.nights_count === 1 ? 'night' : 'nights'}
                    </Typography>
                    <Typography variant="h6" color="primary">
                      {rec.currency} {rec.total_cost}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
