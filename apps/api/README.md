# Backpacking Assistant API

FastAPI backend with LangGraph agentic architecture for intelligent trip planning.

## Architecture

### Super-Agent Orchestrator
The system uses a **super-agent** built with LangGraph 1.0.0 that orchestrates multiple specialized **sub-agents**:

- **Name & Description Agent** ✅ (Implemented)
  - Generates creative trip names and engaging descriptions
  - Uses Gemini 2.5 Flash for content generation

- **Future Sub-Agents** (Planned)
  - Visa Requirements Agent
  - Vaccine Information Agent  
  - Accommodation Recommendations Agent
  - Restaurant Recommendations Agent
  - Activities & Attractions Agent
  - Transportation Planning Agent

### Tech Stack

- **Runtime**: Python 3.11+
- **Framework**: FastAPI
- **Orchestration**: LangGraph 1.0.0
- **LLM**: Google Gemini 2.5 Flash
- **State Management**: LangGraph StateGraph
- **Database**: Supabase (PostgreSQL)

## Directory Structure

```
apps/api/
├── main.py                 # FastAPI application entry point
├── pyproject.toml          # Python dependencies
├── dependencies/           # Shared dependencies (config, auth)
│   ├── config.py
│   └── auth.py
├── routers/               # API endpoints
│   └── agents.py
├── services/              # Business logic
│   ├── trip_service.py
│   └── agents/            # Agent orchestration
│       ├── super_agent.py
│       └── sub_agents/
│           └── name_description_agent.py
├── models/                # Data models
│   └── agent_state.py
└── schemas/               # Pydantic validation schemas
    └── trip_schemas.py
```

## Setup

### 1. Install Dependencies

```bash
cd apps/api
pip install -e .
```

### 2. Environment Configuration

Create a `.env` file:

```bash
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Google Gemini
GEMINI_API_KEY=your_gemini_api_key

# FastAPI
API_HOST=0.0.0.0
API_PORT=8000
API_RELOAD=true

# Environment
ENVIRONMENT=development
```

### 3. Run the Server

```bash
python main.py
```

Or with uvicorn directly:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## API Endpoints

### Health Check
```bash
GET /health
```

### Agent Endpoints

#### Generate Trip Name & Description
```bash
POST /agents/generate-trip-name
```

Request body:
```json
{
  "destinations": ["Tokyo", "Kyoto"],
  "start_point": "San Francisco",
  "end_point": "Osaka",
  "start_date": "2024-06-01",
  "end_date": "2024-06-15",
  "flexible_dates": false,
  "adults_count": 2,
  "children_count": 0,
  "preferences": ["culture", "food", "hiking"],
  "transportation": ["train", "walking"],
  "budget": 3000,
  "currency": "USD"
}
```

Response:
```json
{
  "name": "Tokyo to Osaka: A Cultural Adventure",
  "description": "Experience the best of Japanese culture, cuisine, and nature across two iconic cities."
}
```

#### Process Full Trip (All Agents)
```bash
POST /agents/process-trip
```

Same request body, returns comprehensive information from all agents.

## Development

### API Documentation

Once the server is running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### Adding New Sub-Agents

1. Create agent in `services/agents/sub_agents/your_agent.py`
2. Add node to super-agent graph in `services/agents/super_agent.py`
3. Update state model in `models/agent_state.py`
4. Add routing logic in super-agent's workflow

## Testing

```bash
# Install dev dependencies
pip install -e ".[dev]"

# Run tests
pytest
```

## Integration with Frontend

The frontend Next.js app should call the `/agents/generate-trip-name` endpoint instead of running generation locally. Update `apps/web/app/trip/create/actions.ts` to use this API.

Example:
```typescript
const response = await fetch('http://localhost:8000/agents/generate-trip-name', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(tripData)
});
const { name, description } = await response.json();
```
