# Environment Variables Setup

## Frontend Environment Configuration

Create a `.env.local` file in the `apps/web/` directory with the following variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate_with_openssl_rand_base64_32

# Backend API URL (FastAPI)
# For development, the API runs on port 8000
NEXT_PUBLIC_API_URL=http://localhost:8000

# Google OAuth (if using Google sign-in)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

## Important Notes

1. **NEXT_PUBLIC_API_URL**: This is the URL where your FastAPI backend is running
   - Development: `http://localhost:8000`
   - Production: Your deployed API URL

2. **GEMINI_API_KEY**: No longer needed in frontend!
   - Previously: Used in frontend for trip name generation
   - Now: Only used in backend (`apps/api/.env`)

3. **Generate NEXTAUTH_SECRET**:
   ```bash
   openssl rand -base64 32
   ```

## Backend Environment Configuration

Ensure your backend (`apps/api/.env`) has:

```bash
# Required
GEMINI_API_KEY=your_gemini_api_key

# Optional for testing
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Default settings
API_HOST=0.0.0.0
API_PORT=8000
API_RELOAD=true
ENVIRONMENT=development
```

## Quick Setup

1. **Frontend** (`apps/web/`):
   ```bash
   # Create .env.local file
   touch .env.local
   # Edit and add your environment variables
   ```

2. **Backend** (`apps/api/`):
   ```bash
   # Copy example file
   cp .env.example .env
   # Edit and add your GEMINI_API_KEY
   ```

3. **Verify Configuration**:
   - Frontend should have `NEXT_PUBLIC_API_URL`
   - Backend should have `GEMINI_API_KEY`
   - Both should have Supabase credentials (if using database features)
