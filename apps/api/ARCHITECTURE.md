# Architecture Documentation

## Overview

The Backpacking Assistant API uses a **super-agent orchestration pattern** built with LangGraph 1.0.0 to coordinate multiple specialized AI sub-agents for comprehensive trip planning.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FastAPI Backend                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                    Super-Agent                            │ │
│  │              (LangGraph Orchestrator)                     │ │
│  │                                                           │ │
│  │  ┌─────────────────────────────────────────────────────┐ │ │
│  │  │              StateGraph Workflow                    │ │ │
│  │  │                                                     │ │ │
│  │  │  Initialize → Name/Desc Agent → [Future Agents]   │ │ │
│  │  │                       ↓                            │ │ │
│  │  │                   Finalize                          │ │ │
│  │  └─────────────────────────────────────────────────────┘ │ │
│  │                                                           │ │
│  │  Coordinates:                                            │ │
│  │  • State management (SuperAgentState)                   │ │
│  │  • Error handling and recovery                          │ │
│  │  • Agent execution order                                │ │
│  │  • Result aggregation                                   │ │
│  └───────────────────────────────────────────────────────────┘ │
│                              ↓                                  │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                      Sub-Agents                           │ │
│  ├───────────────────────────────────────────────────────────┤ │
│  │                                                           │ │
│  │  ✅ Name & Description Agent                             │ │
│  │     • Model: Gemini 2.5 Flash                            │ │
│  │     • Task: Generate creative trip names & descriptions  │ │
│  │     • Input: Trip details (destinations, dates, etc.)    │ │
│  │     • Output: name, description                          │ │
│  │                                                           │ │
│  │  🔜 Visa Requirements Agent                              │ │
│  │     • Check visa requirements by destination             │ │
│  │     • Provide application process information            │ │
│  │                                                           │ │
│  │  🔜 Vaccine Information Agent                            │ │
│  │     • Identify required/recommended vaccinations         │ │
│  │     • Provide health advisory information                │ │
│  │                                                           │ │
│  │  🔜 Accommodation Agent                                  │ │
│  │     • Search and recommend accommodations                │ │
│  │     • Consider budget, location, preferences             │ │
│  │                                                           │ │
│  │  🔜 Restaurant Agent                                     │ │
│  │     • Recommend restaurants by destination               │ │
│  │     • Consider cuisine preferences, budget               │ │
│  │                                                           │ │
│  │  🔜 Activities & Attractions Agent                       │ │
│  │     • Suggest activities based on interests              │ │
│  │     • Create day-by-day recommendations                  │ │
│  │                                                           │ │
│  │  🔜 Transportation Agent                                 │ │
│  │     • Plan inter-city and local transportation           │ │
│  │     • Optimize routes and costs                          │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Component Details

### 1. Super-Agent (Orchestrator)

**Location**: `services/agents/super_agent.py`

**Responsibilities**:
- Manage the LangGraph workflow
- Coordinate sub-agent execution
- Maintain shared state across agents
- Handle errors and fallbacks
- Aggregate results from all sub-agents

**State Model**: `SuperAgentState` (TypedDict)
```python
{
    "trip_data": TripData,
    "user_id": Optional[str],
    "trip_name": Optional[str],
    "trip_description": Optional[str],
    "visa_info": Optional[dict],
    "vaccine_info": Optional[dict],
    "accommodation_recommendations": Optional[List[dict]],
    "restaurant_recommendations": Optional[List[dict]],
    "completed_agents": List[str],
    "errors": List[str],
    "status": str
}
```

### 2. Sub-Agents

Each sub-agent is a specialized component focused on one aspect of trip planning.

#### Name & Description Agent

**Location**: `services/agents/sub_agents/name_description_agent.py`

**Technology**: 
- LangChain + Gemini 2.5 Flash
- Temperature: 0.7 (creative)

**Process**:
1. Receives trip details (destinations, dates, preferences, etc.)
2. Formats context into a structured prompt
3. Invokes Gemini model with system prompt
4. Parses JSON response
5. Returns name and description

**Error Handling**: Falls back to simple template-based generation

#### Future Sub-Agents (Placeholder Architecture)

All future agents will follow the same pattern:
1. Dedicated Python module in `sub_agents/`
2. Singleton instance via factory function
3. Specific task execution method
4. Error handling and fallbacks
5. Integration point in super-agent graph

### 3. Service Layer

**Location**: `services/trip_service.py`

**Purpose**: Business logic abstraction between API routes and agents

**Methods**:
- `generate_trip_name_description()`: Single agent execution
- `process_full_trip()`: Full orchestration of all agents

### 4. API Layer

**Location**: `routers/agents.py`

**Endpoints**:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/agents/generate-trip-name` | POST | Generate name & description only |
| `/agents/process-trip` | POST | Run all agents (comprehensive) |
| `/agents/health` | GET | Health check for agents service |

### 5. Data Models

**Schemas** (`schemas/trip_schemas.py`):
- `TripCreateRequest`: Pydantic validation for incoming requests
- `TripNameDescriptionResponse`: Response format for name/description
- `AgentState`: Internal agent state model

**State Definitions** (`models/agent_state.py`):
- `TripData`: TypedDict for trip information
- `SuperAgentState`: TypedDict for LangGraph state

## Data Flow

```
┌──────────────┐
│   Client     │
│  (Next.js)   │
└──────┬───────┘
       │ HTTP POST /agents/generate-trip-name
       │ {destinations, dates, preferences, ...}
       ↓
┌──────────────────┐
│  FastAPI Router  │
│  (agents.py)     │
└──────┬───────────┘
       │ TripCreateRequest (Pydantic validation)
       ↓
┌──────────────────┐
│  Trip Service    │
│ (trip_service.py)│
└──────┬───────────┘
       │ Converts to dict, calls orchestrator
       ↓
┌────────────────────────┐
│  Super-Agent           │
│  (super_agent.py)      │
│                        │
│  1. Initialize state   │
│  2. Run sub-agents ────┼──→ Name/Description Agent
│  3. Finalize           │       (Gemini 2.5 Flash)
└────────┬───────────────┘              │
         │                              │
         │ ←────────────────────────────┘
         │ {name, description}
         ↓
┌──────────────────┐
│  Response        │
│  {name, desc}    │
└──────────────────┘
```

## LangGraph Workflow

The super-agent uses a state graph with the following nodes:

```
                    START
                      ↓
                 [Initialize]
                      ↓
            [Name/Description Agent]
                      ↓
           [Future: Visa Agent] ─────→ (Currently skipped)
                      ↓
          [Future: Vaccine Agent] ───→ (Currently skipped)
                      ↓
        [Future: Accommodation] ─────→ (Currently skipped)
                      ↓
         [Future: Restaurant] ────────→ (Currently skipped)
                      ↓
                  [Finalize]
                      ↓
                     END
```

**State Transitions**:
- Each node receives the current state
- Each node returns an updated state (immutable pattern)
- Errors are collected but don't halt the workflow
- `completed_agents` tracks which agents have run

## Extension Guide

### Adding a New Sub-Agent

1. **Create agent module**: `services/agents/sub_agents/your_agent.py`

```python
class YourAgent:
    def __init__(self):
        # Initialize model, API clients, etc.
        pass
    
    def execute(self, trip_data: Dict[str, Any]) -> Dict[str, Any]:
        # Your agent logic
        return {"result": "data"}

def get_your_agent() -> YourAgent:
    # Singleton pattern
    pass
```

2. **Update state model**: `models/agent_state.py`

```python
class SuperAgentState(TypedDict):
    # ... existing fields
    your_agent_output: Optional[dict]  # Add new field
```

3. **Add node to super-agent**: `services/agents/super_agent.py`

```python
def _build_graph(self):
    workflow = StateGraph(SuperAgentState)
    
    # Add your node
    workflow.add_node("your_agent", self._run_your_agent)
    
    # Add to workflow
    workflow.add_edge("previous_agent", "your_agent")
    workflow.add_edge("your_agent", "next_agent")

def _run_your_agent(self, state: SuperAgentState) -> SuperAgentState:
    agent = get_your_agent()
    result = agent.execute(dict(state["trip_data"]))
    return {
        **state,
        "your_agent_output": result,
        "completed_agents": state.get("completed_agents", []) + ["your_agent"],
    }
```

4. **Update service and API** as needed

## Technology Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| Framework | FastAPI | 0.115.0+ |
| Orchestration | LangGraph | 1.0.0 |
| LLM Framework | LangChain | 0.3.0+ |
| LLM Model | Gemini 2.5 Flash | Latest |
| Validation | Pydantic | 2.9.0+ |
| Database | Supabase | 2.0.0+ |
| Runtime | Python | 3.11+ |

## Design Patterns

1. **Singleton Pattern**: Agents and services use singleton instances
2. **Dependency Injection**: FastAPI's `Depends()` for service injection
3. **State Machine**: LangGraph manages state transitions
4. **Repository Pattern**: Separation of business logic from data access
5. **Factory Pattern**: Agent creation through factory functions

## Performance Considerations

- **Async/Await**: All agents and services use async for non-blocking I/O
- **Singleton Instances**: Agents are created once and reused
- **Streaming**: Future support for SSE/WebSocket for real-time updates
- **Caching**: Future Redis integration for response caching

## Security

- **Environment Variables**: Sensitive data in `.env` files
- **API Keys**: Managed through pydantic-settings
- **Auth Middleware**: Placeholder for JWT validation
- **Input Validation**: Pydantic schemas validate all inputs

## Monitoring & Logging

- **Health Endpoints**: `/health` and `/agents/health`
- **Error Tracking**: Errors collected in state and logged
- **Future**: Integration with observability platforms
