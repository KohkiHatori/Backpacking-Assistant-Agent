# Quick Start Guide

Get the Backpacking Assistant API running in 5 minutes.

## Prerequisites

- Python 3.11 or higher
- Google Gemini API key
- Supabase account (for full features)

## Installation

### 1. Navigate to API directory

```bash
cd apps/api
```

### 2. Create virtual environment

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Set up environment variables

Create a `.env` file:

```bash
cp .env.example .env
```

Edit `.env` and add your API keys:

```bash
# Required
GEMINI_API_KEY=your_gemini_api_key_here

# Optional for testing
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Default settings (can keep as-is)
API_HOST=0.0.0.0
API_PORT=8000
API_RELOAD=true
ENVIRONMENT=development
```

### 5. Run the server

```bash
python main.py
```

Or with uvicorn:

```bash
uvicorn main:app --reload
```

You should see:

```
🚀 Starting Backpacking Assistant API...
Environment: development
✅ Configuration validated
✅ Agent orchestrator ready
INFO:     Uvicorn running on http://0.0.0.0:8000
```

## Test the API

### Option 1: Test Script

```bash
python test_agent.py
```

Expected output:
```
🧪 Testing Name & Description Agent...

✅ Results:
Status: completed
Trip Name: Tokyo to Osaka: A Cultural Adventure
Description: Experience the best of Japanese culture...
Completed Agents: initialize, name_description_agent, finalize

🎉 Test passed successfully!
```

### Option 2: cURL

```bash
curl -X POST http://localhost:8000/agents/generate-trip-name \
  -H "Content-Type: application/json" \
  -d '{
    "destinations": ["Paris", "Lyon"],
    "start_point": "London",
    "end_point": "Lyon",
    "start_date": "2024-07-01",
    "end_date": "2024-07-10",
    "flexible_dates": false,
    "adults_count": 2,
    "children_count": 0,
    "preferences": ["food", "art", "history"],
    "transportation": ["train"],
    "budget": 2000,
    "currency": "EUR"
  }'
```

### Option 3: Interactive API Docs

Open your browser and visit:

**Swagger UI**: http://localhost:8000/docs

Try the `/agents/generate-trip-name` endpoint with the example request body.

## Next Steps

### Integrate with Frontend

See [INTEGRATION.md](./INTEGRATION.md) for detailed instructions on connecting the Next.js frontend.

### Add More Sub-Agents

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the extension guide.

### Deploy to Production

1. **Using Docker**:

```bash
docker build -t backpacking-api .
docker run -p 8000:8000 --env-file .env backpacking-api
```

2. **Using Docker Compose** (from project root):

Update `docker-compose.yml` to include the API service, then:

```bash
docker-compose up
```

3. **Cloud Deployment**:

Deploy to services like:
- Railway
- Render
- Google Cloud Run
- AWS ECS
- Azure Container Instances

## Troubleshooting

### Issue: "GEMINI_API_KEY not set"

**Solution**: Make sure you've created a `.env` file with your API key:
```bash
echo "GEMINI_API_KEY=your_key_here" > .env
```

### Issue: "ModuleNotFoundError"

**Solution**: Install dependencies:
```bash
pip install -r requirements.txt
```

### Issue: Port 8000 already in use

**Solution**: Change the port in `.env`:
```bash
API_PORT=8001
```

### Issue: CORS errors from frontend

**Solution**: Add your frontend URL to CORS configuration in `main.py`:
```python
allow_origins=[
    "http://localhost:3000",
    "http://localhost:3001",
    # Add your URL here
]
```

## Development Commands

```bash
# Run with auto-reload
python main.py

# Run tests
pytest

# Format code
black .

# Lint code
ruff check .

# Type check (if using mypy)
mypy .
```

## API Endpoints Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | API information |
| `/health` | GET | Health check |
| `/agents/health` | GET | Agents health check |
| `/agents/generate-trip-name` | POST | Generate trip name & description |
| `/agents/process-trip` | POST | Run all agents (future) |
| `/docs` | GET | Swagger UI documentation |
| `/redoc` | GET | ReDoc documentation |

## Getting Help

- **Documentation**: See [README.md](./README.md) and [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Integration**: See [INTEGRATION.md](./INTEGRATION.md)
- **Issues**: Check the project repository for known issues

## What's Next?

You now have a working AI agent system! Next features to implement:

1. ✅ Name & Description Generation (Done)
2. 🔜 Visa Requirements Agent
3. 🔜 Vaccine Information Agent
4. 🔜 Accommodation Recommendations
5. 🔜 Restaurant Recommendations
6. 🔜 WebSocket support for real-time updates
7. 🔜 Caching with Redis
8. 🔜 Full authentication/authorization

Happy coding! 🚀
