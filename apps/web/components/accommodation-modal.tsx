"use client";
import {
  Modal,
  Box,
  Typography,
  IconButton,
  CircularProgress,
  Card,
  CardContent,
  CardHeader,
  List,
  ListItem,
  ListItemText,
  Alert,
  AlertTitle,
  Button,
} from "@mui/material";
import { Close as CloseIcon, Hotel, AttachMoney, LocationOn } from "@mui/icons-material";
import { useState, useEffect } from "react";

interface Accommodation {
  name: string;
  type: string;
  price_per_night?: number;
  total_cost?: number;
  currency?: string;
  estimated_cost?: string; // Legacy support
  amenities?: string[];
  description?: string;
  location?: string;
  why_fits?: string;
  booking_url?: string;
}

interface AccommodationModalProps {
  open: boolean;
  onClose: () => void;
  taskTitle: string | null;
  tripId: string;
}

// Simple markdown parser for **bold** text and newlines
const renderMarkdown = (text: string | undefined) => {
  if (!text) return null;
  if (typeof text !== 'string') return String(text);

  // Split by **...** pattern, capturing the delimiter
  // Using [\s\S] to match any character including newlines
  const parts = text.split(/(\*\*[\s\S]*?\*\*)/g);

  return (
    <span>
      {parts.map((part, index) => {
        // Check if this part is a bold section
        if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
          return <strong key={index}>{part.slice(2, -2)}</strong>;
        }

        // For non-bold parts, handle newlines
        return part.split('\n').map((line, lineIndex, array) => (
          <span key={`${index}-${lineIndex}`}>
            {line}
            {lineIndex < array.length - 1 && <br />}
          </span>
        ));
      })}
    </span>
  );
};

export default function AccommodationModal({
  open,
  onClose,
  taskTitle,
  tripId,
}: AccommodationModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);

  useEffect(() => {
    const fetchAccommodations = async () => {
      if (!open) return;

      setIsLoading(true);
      setError(null);
      setAccommodations([]);

      try {
        const response = await fetch("/api/accommodation", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ tripId, taskTitle }),
        });

        if (!response.ok) {
          throw new Error("Failed to generate accommodations.");
        }

        const data = await response.json();

        // Handle different response structures
        let items: Accommodation[] = [];

        if (Array.isArray(data)) {
          items = data;
        } else if (data && data.recommendations && Array.isArray(data.recommendations)) {
          items = data.recommendations;
        } else {
          console.warn("Received unexpected data format:", data);
          // Don't error out immediately if we can't parse, just show empty or try to handle
          // But here we set error to inform user
          setError("Received invalid data from server.");
          return;
        }

        setAccommodations(items);

      } catch (err: any) {
        console.error("Error fetching accommodations:", err);
        setError(err.message || "An unexpected error occurred.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAccommodations();
  }, [open, tripId, taskTitle]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="accommodation-modal-title"
    >
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "90%",
          maxWidth: 700,
          bgcolor: "background.paper",
          boxShadow: 24,
          p: 4,
          borderRadius: 2,
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography id="accommodation-modal-title" variant="h6">
            Recommended Stays
          </Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>

        {isLoading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              py: 5,
              flexDirection: "column",
              gap: 2
            }}
          >
            <CircularProgress />
            <Typography>
              Researching best options for you...
            </Typography>
          </Box>
        ) : error ? (
          <Alert severity="error">
            <AlertTitle>Error</AlertTitle>
            {error}
          </Alert>
        ) : (
          <Box>
            {accommodations.length === 0 ? (
              <Typography color="text.secondary" align="center" py={4}>
                No recommendations found. Try again later.
              </Typography>
            ) : (
              <List sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {accommodations.map((acc, index) => (
                  <Card key={index} variant="outlined">
                    <CardHeader
                      title={renderMarkdown(acc.name)}
                      subheader={acc.type}
                      avatar={<Hotel color="primary" />}
                      action={
                        acc.price_per_night ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', mr: 1, mt: 1 }}>
                            <Typography variant="h6" color="primary.main">
                              {acc.currency} {acc.price_per_night}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                              /night
                            </Typography>
                          </Box>
                        ) : acc.estimated_cost ? (
                          <Typography variant="body1" sx={{ mt: 1, mr: 1 }}>
                            {acc.estimated_cost}
                          </Typography>
                        ) : null
                      }
                    />
                    <CardContent sx={{ pt: 0 }}>

                      {acc.location && (
                        <Box sx={{ display: "flex", alignItems: "center", mb: 2, color: "text.secondary" }}>
                          <LocationOn fontSize="small" sx={{ mr: 0.5 }} />
                          <Typography variant="body2">
                            {acc.location}
                          </Typography>
                        </Box>
                      )}

                      {acc.description && (
                        <Typography variant="body2" paragraph>
                          {renderMarkdown(acc.description)}
                        </Typography>
                      )}

                      {acc.why_fits && (
                        <Box sx={{ mt: 2, bgcolor: 'action.hover', p: 1.5, borderRadius: 1 }}>
                          <Typography variant="subtitle2" gutterBottom color="primary">
                            Why it fits:
                          </Typography>
                          <Typography variant="body2">
                            {renderMarkdown(acc.why_fits)}
                          </Typography>
                        </Box>
                      )}

                      {/* Legacy support for amenities list if present */}
                      {acc.amenities && acc.amenities.length > 0 && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="subtitle2">Amenities:</Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 0.5 }}>
                            {acc.amenities.map((amenity, i) => (
                              <Typography key={i} variant="caption" sx={{ bgcolor: 'grey.100', px: 1, py: 0.5, borderRadius: 1 }}>
                                {amenity}
                              </Typography>
                            ))}
                          </Box>
                        </Box>
                      )}

                      {acc.booking_url && (
                        <Button
                          variant="contained"
                          href={acc.booking_url}
                          target="_blank"
                          sx={{ mt: 2 }}
                          fullWidth
                        >
                          Check Availability
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </List>
            )}
          </Box>
        )}
      </Box>
    </Modal>
  );
}
