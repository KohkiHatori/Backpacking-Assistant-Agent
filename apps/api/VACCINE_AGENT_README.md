# Vaccine Agent Implementation

## Overview

The Vaccine Agent is a specialized sub-agent that uses Perplexity AI to research vaccine requirements for trip destinations and generates appropriate vaccination tasks based on current health recommendations from trusted sources like CDC and WHO.

## Features

✅ **AI-Powered Research**: Uses Perplexity AI to get up-to-date vaccine information
✅ **Reliable Sources**: Specifically queries CDC Travelers' Health and WHO International Travel & Health
✅ **Smart Parsing**: Automatically identifies required vs recommended vaccines
✅ **Context-Aware**: Considers trip dates for time-sensitive requirements
✅ **One Task Per Vaccine**: Creates actionable, individual tasks for each vaccine
✅ **Destination Matching**: Links vaccines to specific destinations that require them

## Architecture

```
TaskAgent
    └── VaccineAgent (sub-agent)
            ├── Perplexity AI Research
            ├── Vaccine Detection & Parsing
            └── Task Generation Logic
```

## Files Created/Modified

### New Files
- `apps/api/services/agents/sub_agents/vaccine_agent.py` - Main vaccine agent implementation
- `apps/api/VACCINE_AGENT_README.md` - This documentation

### Modified Files
- `apps/api/services/agents/sub_agents/task_agent.py` - Integrated vaccine agent
- `apps/api/services/agents/sub_agents/__init__.py` - Added vaccine agent exports
- `apps/api/requirements.txt` - Added `perplexity-sdk`
- `apps/api/dependencies/config.py` - Already had `perplexity_api_key`

## Configuration

### Environment Variables

Add the following to your `.env` file:

```bash
PERPLEXITY_API_KEY=pplx-your_key_here
```

To get a Perplexity API key:
1. Sign up at https://www.perplexity.ai/
2. Go to API settings
3. Generate an API key
4. Note: The API is paid, but has a free tier for testing

### API Model

The agent uses the `sonar` model (cheaper, faster) instead of `sonar-pro`:
- Model: `sonar`
- Cost: Lower than sonar-pro
- Quality: Sufficient for vaccine research

## How It Works

### 1. Research Phase

The agent constructs a comprehensive query for Perplexity AI:

```
What vaccines and immunizations are required or recommended for travelers visiting [destinations]?

Please check reliable sources like:
- CDC Travelers' Health (USA)
- WHO International Travel and Health
- Official government travel health advisories

For each vaccine, specify:
1. Vaccine name
2. Whether it's REQUIRED or RECOMMENDED
3. Which destination(s) it applies to
4. Any important timing or dosage notes

Focus on practical, actionable advice for a traveler departing around [date].

Traveler is from [citizenship].
```

### 2. Parsing Phase

The agent analyzes the Perplexity response to:
- **Identify vaccines mentioned** (Yellow Fever, Typhoid, Hepatitis A, etc.)
- **Determine requirement level** (Required vs Recommended)
- **Extract context** (dosage, timing, special notes)
- **Match to destinations** (which countries need which vaccines)

Supported vaccines:
- Yellow Fever
- Typhoid
- Hepatitis A & B
- Rabies
- Japanese Encephalitis
- Malaria (prevention)
- Tetanus/Diphtheria
- Measles/Mumps/Rubella
- Polio
- COVID-19
- Cholera
- Meningococcal
- Tuberculosis
- Influenza

### 3. Task Generation

For each identified vaccine, creates a task with:

**Required Vaccines:**
- Title: "Get required [Vaccine] vaccine"
- Priority: `high`
- Category: `health`
- Description: Includes destinations, timing, and consultation advice

**Recommended Vaccines:**
- Title: "Consider [Vaccine] vaccine"
- Priority: `medium`
- Category: `health`
- Description: Includes destinations, timing, and consultation advice

## Task Examples

### Example 1: Required Yellow Fever Vaccine

```json
{
  "title": "Get required Yellow Fever vaccine",
  "description": "Yellow Fever vaccine is required for travel to Brazil. Consult your doctor or a travel clinic. Recommended: Get vaccinated at least 4-6 weeks before travel.",
  "category": "health",
  "priority": "high",
  "completed": false
}
```

### Example 2: Recommended Typhoid Vaccine

```json
{
  "title": "Consider Typhoid vaccine",
  "description": "Typhoid vaccine is recommended for travel to India, Thailand, and Indonesia. Consult your doctor or a travel clinic. Recommended: Get vaccinated at least 2-4 weeks before travel.",
  "category": "health",
  "priority": "medium",
  "completed": false
}
```

### Example 3: Hepatitis A (Multiple Destinations)

```json
{
  "title": "Consider Hepatitis A vaccine",
  "description": "Hepatitis A vaccine is recommended for travel to Mexico, Peru, and Colombia. Consult your doctor or a travel clinic. Recommended: Get vaccinated at least 2-4 weeks before travel.",
  "category": "health",
  "priority": "medium",
  "completed": false
}
```

## Integration with Task Agent

The Task Agent automatically calls the Vaccine Agent when generating tasks:

```python
# In TaskAgent.generate_tasks()

# 1. Get visa tasks from Visa Agent
visa_tasks = visa_agent.generate_visa_tasks(trip_data, user_citizenship)

# 2. Get vaccine tasks from Vaccine Agent
vaccine_tasks = vaccine_agent.generate_vaccine_tasks(trip_data, user_citizenship)

# 3. Get general tasks from LLM (filtered to avoid duplicates)
general_tasks = llm.generate_tasks(...)

# 4. Combine all tasks
all_tasks = visa_tasks + vaccine_tasks + general_tasks
```

### Duplicate Filtering

The task agent filters out generic health/vaccine tasks from the LLM if the vaccine agent provides specific tasks:

```python
# Remove generic vaccine tasks from LLM
general_tasks = [
    task for task in general_tasks
    if not (task.get("category") == "health" and 
           any(word in task.get("title").lower() 
               for word in ["vaccine", "vaccination", "immunization"]))
]
```

## Debug Logging

The vaccine agent includes comprehensive logging:

```
[VACCINE AGENT] Starting vaccine task generation
[VACCINE AGENT] Destinations: ['Tokyo, Japan', 'Bangkok, Thailand']
[VACCINE AGENT] Start date: 2025-06-01
[VACCINE AGENT] User citizenship: United States
[VACCINE AGENT] 🔍 Researching vaccine requirements via Perplexity...
[VACCINE AGENT]   📡 Querying Perplexity (model: sonar)...
[VACCINE AGENT]   ✓ Retrieved 5 citations
[VACCINE AGENT]     1. https://wwwnc.cdc.gov/travel/destinations/...
[VACCINE AGENT]     2. https://www.who.int/travel-advice/...
[VACCINE AGENT]   ✓ Response length: 1250 characters
[VACCINE AGENT] 📋 Parsing vaccine recommendations...
[VACCINE AGENT] ✓ Total vaccine tasks generated: 4
```

## Error Handling

### Missing API Key
If `PERPLEXITY_API_KEY` is not set:
- Agent logs warning
- Returns empty task list
- Task generation continues with other agents

### API Failures
If Perplexity API fails:
- Error is logged with traceback
- Returns empty task list
- Task generation continues normally

### No Vaccines Identified
If no specific vaccines are found in research:
- Creates a generic "Research vaccine requirements" task
- Includes all destinations
- Priority: `high`

## Cost Considerations

### Perplexity API Costs
- Model: `sonar` (cheaper option)
- Cost per query: ~$0.01 - $0.05 depending on response length
- One query per trip (all destinations researched together)

### Optimization Tips
1. **Batch destinations**: Agent queries all destinations in one API call
2. **Cache results**: Consider caching vaccine requirements by destination
3. **Rate limiting**: Perplexity has rate limits, monitor usage

## Testing

### Manual Testing

You can test the vaccine agent by generating tasks for a trip:

```python
from services.agents.sub_agents.vaccine_agent import get_vaccine_agent

agent = get_vaccine_agent()

trip_data = {
    "destinations": ["Bangkok, Thailand", "Hanoi, Vietnam"],
    "start_date": "2025-06-01",
    "end_date": "2025-06-15"
}

tasks = agent.generate_vaccine_tasks(trip_data, "United States")

for task in tasks:
    print(f"[{task['priority']}] {task['title']}")
```

### Expected Output

For a trip to Thailand and Vietnam from the USA, you might get:
- Consider Typhoid vaccine (medium priority)
- Consider Hepatitis A vaccine (medium priority)
- Consider Japanese Encephalitis vaccine (medium priority)
- Consider Rabies vaccine (medium priority)

## Limitations

1. **AI-Generated Content**: Vaccine recommendations are AI-generated and should not replace professional medical advice
2. **Up-to-Date Information**: Perplexity searches current sources, but users should verify with their doctor
3. **Personal Health Factors**: Agent doesn't consider user's medical history or allergies
4. **Regional Variations**: Some destinations have different requirements based on specific regions

## Disclaimer

**Important**: The vaccine agent provides general travel health information based on AI research. Users should:
- Consult with a qualified healthcare provider or travel medicine specialist
- Verify current vaccine requirements with official sources (CDC, WHO)
- Consider personal health factors and medical history
- Start vaccinations well in advance of travel

## Future Enhancements

Potential improvements:
- [ ] Cache vaccine requirements by country to reduce API calls
- [ ] Add user vaccination history tracking
- [ ] Include malaria prevention medication recommendations
- [ ] Add cost estimates for vaccines
- [ ] Integrate with local travel clinic finder
- [ ] Support for children's vaccination schedules
- [ ] Add allergy/contraindication warnings

## Support

For issues or questions:
1. Check logs for error messages (`[VACCINE AGENT]` prefix)
2. Verify `PERPLEXITY_API_KEY` is set in `.env`
3. Ensure perplexity-sdk is installed: `pip install perplexity-sdk`
4. Check Perplexity API dashboard for usage/errors

## License

Part of the Backpacking Assistant Agent project.
