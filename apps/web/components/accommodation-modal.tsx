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
  Divider,
  Button,
  Alert,
  AlertTitle,
} from "@mui/material";
import { Close as CloseIcon, Hotel, AttachMoney } from "@mui/icons-material";
import { useState, useEffect } from "react";

interface Accommodation {
  name: string;
  type: string;
  estimated_cost: string;
  amenities: string[];
  booking_url?: string;
}

interface AccommodationModalProps {
  open: boolean;
  onClose: () => void;
  taskTitle: string | null;
  tripId: string;
}

// Dummy data for now
const dummyData: Accommodation[] = [
  {
    name: "Example Hotel",
    type: "Hotel",
    estimated_cost: "$150/night",
    amenities: ["WiFi", "Pool", "Free Breakfast"],
    booking_url: "https://example.com",
  },
  {
    name: "Cozy Airbnb",
    type: "Apartment",
    estimated_cost: "$100/night",
    amenities: ["Kitchen", "WiFi", "Washer/Dryer"],
    booking_url: "https://example.com",
  },
];

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

        if (Array.isArray(data)) {
          setAccommodations(data);
        } else {
          console.error("Received invalid data format:", data);
          setError("Received invalid data from server.");
        }

      } catch (err: any) {
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
          maxWidth: 600,
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
            AI-Generated Accommodations for: {taskTitle}
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
            }}
          >
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>
              Finding the best stays for you...
            </Typography>
          </Box>
        ) : error ? (
          <Alert severity="error">
            <AlertTitle>Error</AlertTitle>
            {error}
          </Alert>
        ) : (
          <List>
            {accommodations.map((acc, index) => (
              <Card key={index} sx={{ mb: 2 }}>
                <CardHeader
                  title={acc.name}
                  subheader={acc.type}
                  avatar={<Hotel />}
                />
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      mb: 1,
                    }}
                  >
                    <AttachMoney sx={{ mr: 1 }} />
                    <Typography variant="body1">
                      {acc.estimated_cost}
                    </Typography>
                  </Box>

                  <Typography variant="subtitle2" sx={{ mt: 2 }}>
                    Amenities:
                  </Typography>
                  <List dense>
                    {acc.amenities.map((amenity, i) => (
                      <ListItem key={i}>
                        <ListItemText primary={amenity} />
                      </ListItem>
                    ))}
                  </List>

                  {acc.booking_url && (
                    <Button
                      variant="contained"
                      href={acc.booking_url}
                      target="_blank"
                      sx={{ mt: 2 }}
                    >
                      Book Now
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </List>
        )}
      </Box>
    </Modal>
  );
}
