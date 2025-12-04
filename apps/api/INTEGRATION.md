# Frontend Integration Guide

This guide shows how to integrate the new backend API agent system with the existing Next.js frontend.

## Overview

The backend now handles trip name and description generation through a LangGraph-orchestrated agent system. This replaces the frontend-based generation.

## Changes Required in Frontend

### 1. Update `apps/web/app/trip/create/actions.ts`

Replace the existing `generateTripNameAndDescription` function with an API call:

```typescript
// OLD - Frontend Generation (REMOVE)
async function generateTripNameAndDescription(tripData: any) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  // ... existing code
}

// NEW - Backend API Call (ADD)
async function generateTripNameAndDescription(tripData: any) {
  try {
    const response = await fetch('http://localhost:8000/agents/generate-trip-name', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        destinations: tripData.destinations,
        start_point: tripData.startPoint,
        end_point: tripData.endPoint,
        start_date: tripData.startDate,
        end_date: tripData.endDate,
        flexible_dates: tripData.flexibleDates,
        adults_count: tripData.adultsCount,
        children_count: tripData.childrenCount,
        preferences: tripData.preferences,
        transportation: tripData.transportation,
        budget: tripData.budget,
        currency: tripData.currency,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate trip name and description');
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error generating trip name and description:", error);
    // Fallback
    return {
      name: `Trip to ${tripData.destinations[0] || tripData.endPoint || "Unknown"}`,
      description: "An amazing adventure awaits!",
    };
  }
}
```

### 2. Environment Configuration

Add the API URL to your frontend environment variables:

**`apps/web/.env.local`:**
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Then update the fetch call to use the environment variable:

```typescript
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const response = await fetch(`${apiUrl}/agents/generate-trip-name`, {
  // ...
});
```

### 3. Optional: Remove Gemini Dependency from Frontend

Since generation now happens in the backend, you can remove the Gemini SDK from the frontend:

**`apps/web/package.json`:**
```json
{
  "dependencies": {
    // Remove this line:
    // "@google/generative-ai": "^x.x.x",
  }
}
```

**`apps/web/app/trip/create/actions.ts`:**
```typescript
// Remove this import:
// import { GoogleGenerativeAI } from "@google/generative-ai";
// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
```

## Running Both Services

### Development Mode

**Terminal 1 - Backend:**
```bash
cd apps/api
python main.py
```

**Terminal 2 - Frontend:**
```bash
cd apps/web
npm run dev
```

### Docker Compose (Future)

Update `docker-compose.yml` to include the FastAPI service:

```yaml
services:
  api:
    build:
      context: ./apps/api
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      - GEMINI_API_KEY=${GEMINI_API_KEY}
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
    volumes:
      - ./apps/api:/app
    command: uvicorn main:app --host 0.0.0.0 --port 8000 --reload
  
  web:
    # ... existing Next.js configuration
    environment:
      - NEXT_PUBLIC_API_URL=http://api:8000
    depends_on:
      - api
```

## API Response Format

The backend API returns the same format as the frontend generation:

```typescript
interface TripNameDescriptionResponse {
  name: string;
  description: string;
}
```

Example response:
```json
{
  "name": "Tokyo to Osaka: A Cultural Adventure",
  "description": "Experience the best of Japanese culture, cuisine, and nature across two iconic cities."
}
```

## Error Handling

The API uses standard HTTP status codes:

- **200 OK**: Success
- **400 Bad Request**: Invalid input data
- **500 Internal Server Error**: Generation failed

Handle errors appropriately in the frontend:

```typescript
if (!response.ok) {
  const error = await response.json();
  console.error('API Error:', error.detail);
  // Show user-friendly error message
  throw new Error(error.detail || 'Failed to generate trip information');
}
```

## Future Enhancements

Once other agents are implemented, you can call the comprehensive endpoint:

```typescript
const response = await fetch(`${apiUrl}/agents/process-trip`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(tripData),
});

const result = await response.json();
// result will include:
// - name, description
// - visa_info (future)
// - vaccine_info (future)
// - accommodation_recommendations (future)
// - restaurant_recommendations (future)
```

## Testing the Integration

1. Start the backend server
2. Start the frontend server
3. Navigate to the trip creation page
4. Fill in trip details
5. Submit the form
6. Verify the trip is created with AI-generated name and description

## Troubleshooting

### CORS Issues

If you encounter CORS errors, make sure the backend's CORS configuration includes your frontend URL:

**`apps/api/main.py`:**
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Add your frontend URL
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Connection Refused

Make sure the backend is running on port 8000:
```bash
curl http://localhost:8000/health
```

### API Key Issues

Verify your `.env` file in `apps/api/` has the correct `GEMINI_API_KEY`.
