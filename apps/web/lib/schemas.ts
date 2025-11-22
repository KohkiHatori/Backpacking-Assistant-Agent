import { z } from "zod";

// --- Users ---

export const userSchema = z.object({
  id: z.string().uuid(),
  name: z.string().nullable(),
  email: z.string().email().nullable(),
  image: z.string().url().nullable(),
  citizenship: z.string().nullable(),
  currency: z.string().default("USD").nullable(),
  food_dietary: z.string().nullable(), // e.g. "Vegan", "Gluten-Free"
  onboarding_completed: z.boolean().default(false),
  created_at: z.string().datetime().optional(),
});

export type User = z.infer<typeof userSchema>;

// --- Trips ---

export const tripSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  name: z.string().min(1, "Trip name is required"),
  description: z.string().nullable().optional(),

  // Logistics
  start_point: z.string().nullable().optional(),
  end_point: z.string().nullable().optional(),
  start_date: z.string().date().nullable().optional(), // YYYY-MM-DD
  end_date: z.string().date().nullable().optional(),   // YYYY-MM-DD
  flexible_dates: z.boolean().default(false),

  // Travelers
  adults_count: z.number().int().positive().default(1),
  children_count: z.number().int().nonnegative().default(0),

  // Arrays/Tags
  destinations: z.array(z.string()).default([]),
  preferences: z.array(z.string()).default([]),
  transportation: z.array(z.string()).default([]),

  budget: z.number().int().nonnegative().nullable().optional(),
  currency: z.string().default("USD"),

  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export type Trip = z.infer<typeof tripSchema>;

// --- Itinerary Items ---

export const itineraryItemSchema = z.object({
  id: z.string().uuid(),
  trip_id: z.string().uuid(),

  // Scheduling
  day_number: z.number().int().min(1),
  order_index: z.number().int().default(0),
  date: z.string().date().nullable().optional(), // Optional concrete date
  start_time: z.string().time().nullable().optional(), // HH:MM:SS
  end_time: z.string().time().nullable().optional(),   // HH:MM:SS

  // Details
  title: z.string().min(1, "Title is required"),
  description: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  geo_coordinates: z.tuple([z.number(), z.number()]).nullable().optional(), // [lat, lng] if using simple point

  type: z.enum(["activity", "transport", "accommodation", "meal", "other"]).nullable().optional(),
  cost: z.number().int().nonnegative().nullable().optional(),

  created_at: z.string().datetime().optional(),
});

export type ItineraryItem = z.infer<typeof itineraryItemSchema>;

// --- Tasks ---

export const taskSchema = z.object({
  id: z.string().uuid(),
  trip_id: z.string().uuid(),

  title: z.string().min(1, "Task title is required"),
  description: z.string().nullable().optional(),
  is_completed: z.boolean().default(false),

  due_date: z.string().datetime().nullable().optional(),
  category: z.string().nullable().optional(), // e.g. 'booking', 'packing'
  priority: z.enum(["low", "medium", "high"]).default("medium"),

  created_at: z.string().datetime().optional(),
});

export type Task = z.infer<typeof taskSchema>;
