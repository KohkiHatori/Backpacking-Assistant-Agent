# Visa Agent Implementation

## Overview

The Visa Agent is a specialized sub-agent that integrates with the RapidAPI Visa Requirement API to automatically check visa requirements for trip destinations and generate appropriate tasks based on the visa rules.

## Features

✅ **Automatic Visa Checking**: Queries the Visa Requirement API for each destination
✅ **Smart Task Generation**: Creates different tasks based on visa requirements:
- Visa-free → Passport validity check
- Visa required → Visa application task with embassy links
- Visa on arrival / eVisa → Pre-arrival preparation tasks
- Mandatory registration → e-Arrival or similar registrations

✅ **Country/City Mapping**: Comprehensive mapping of 100+ countries and major cities to ISO 3166-1 alpha-2 codes
✅ **Deduplication**: Automatically handles multiple cities in the same country
✅ **Fallback Handling**: Gracefully falls back to generic tasks if API fails
✅ **User-Specific**: Uses the user's citizenship from their profile

## Architecture

```
TaskAgent
    └── VisaAgent (sub-agent)
            ├── Country Code Mapping
            ├── API Integration
            └── Task Generation Logic
```

## Files Created/Modified

### New Files
- `apps/api/services/agents/sub_agents/visa_agent.py` - Main visa agent implementation
- `apps/api/VISA_AGENT_README.md` - This documentation

### Modified Files
- `apps/api/services/agents/sub_agents/task_agent.py` - Integrated visa agent
- `apps/api/services/agents/sub_agents/__init__.py` - Added visa agent exports
- `apps/api/routers/tasks.py` - Fetch user citizenship and pass to task agent
- `apps/api/dependencies/config.py` - Added `rapidapi_secret` configuration
- `apps/api/requirements.txt` - Added `requests` library

## Configuration

### Environment Variables

Add the following to your `.env` file:

```bash
RAPIDAPI_SECRET=your_rapidapi_key_here
```

To get a RapidAPI key:
1. Sign up at https://rapidapi.com/
2. Subscribe to the "Visa Requirement" API at https://rapidapi.com/ptwebsolution/api/visa-requirement
3. Copy your API key

### Database Schema

The visa agent uses the `citizenship` field from the `users` table:
- Field: `citizenship` (text)
- Format: Full country name from restcountries.com API (e.g., "United States", "China", "United Kingdom")
- The visa agent automatically maps this to ISO 3166-1 alpha-2 codes using restcountries.com

### External API Dependencies

1. **RapidAPI Visa Requirement** (Primary)
   - Endpoint: `https://visa-requirement.p.rapidapi.com/v2/visa/check`
   - Purpose: Get visa requirements between passport and destination countries
   - Required: Yes (falls back to generic tasks if unavailable)

2. **restcountries.com** (Supporting)
   - Endpoint: `https://restcountries.com/v3.1/name/{country}`
   - Purpose: Map country names to ISO codes
   - Required: No (falls back to static mapping)
   - Rate Limit: Free tier, no authentication needed

## API Integration

### Endpoint
```
POST https://visa-requirement.p.rapidapi.com/v2/visa/check
```

### Request Format
```json
{
  "passport": "CN",
  "destination": "ID"
}
```

### Response Format
```json
{
  "data": {
    "passport": {
      "code": "CN",
      "name": "China"
    },
    "destination": {
      "code": "ID",
      "name": "Indonesia",
      "passport_validity": "6 months beyond stay"
    },
    "visa_rules": {
      "primary_rule": {
        "name": "Visa on arrival",
        "duration": "30 days",
        "link": "https://..."
      },
      "secondary_rule": {
        "name": "eVisa",
        "duration": "30 days",
        "link": "https://..."
      }
    },
    "mandatory_registration": {
      "name": "e-Arrival",
      "link": "https://..."
    }
  }
}
```

## Task Generation Logic

### 1. Visa-Free Entry
**Conditions**: `visa_rules.primary_rule.name` contains "visa-free"

**Generated Task**:
- **Title**: "Check passport validity for [Destination]"
- **Category**: `documentation`
- **Priority**: `high`
- **Description**: Includes passport validity requirements and entry duration

**Example**:
```
Check passport validity for Tokyo
Required validity: Valid for duration of stay
Entry allowed for: 90 days
Recommended: Verify 6 weeks before trip
```

### 2. Visa Required
**Conditions**: `visa_rules.primary_rule.name` contains "visa required"

**Generated Task**:
- **Title**: "Apply for [Destination] visa"
- **Category**: `visa`
- **Priority**: `high`
- **Description**: Includes visa type, duration, passport requirements, and application links

**Example**:
```
Apply for visa to London
Visa type: Visa required
Duration: 180 days
Passport validity required: Valid for duration of stay
Application link: https://www.gov.uk/apply-uk-visa
Recommended: Apply 6-8 weeks before trip
```

### 3. Visa on Arrival / eVisa
**Conditions**: `visa_rules.primary_rule.name` contains "visa on arrival" or "evisa"

**Generated Task**:
- **Title**: "Get [Visa Type] for [Destination]"
- **Category**: `visa`
- **Priority**: `high`
- **Description**: Includes visa details, alternatives, and links

**Example**:
```
Get Visa on arrival for Bali
Duration: 30 days
Passport validity required: 6 months beyond stay
Alternative: eVisa (30 days) - https://example.com/evisa
Recommended: Check requirements 3-4 weeks before trip
```

### 4. Mandatory Registration
**Conditions**: `mandatory_registration` is present

**Generated Task** (additional):
- **Title**: "Complete [Registration Name] for [Destination]"
- **Category**: `documentation`
- **Priority**: `high`
- **Description**: Includes registration link and timing

**Example**:
```
Complete e-Arrival for Bali
This is mandatory before arrival
Registration link: https://example.com/e-arrival
Recommended: Complete 1-2 weeks before trip
```

## Smart Country Code Mapping

The visa agent uses an intelligent multi-tier approach to map locations to ISO 3166-1 alpha-2 country codes:

### Mapping Strategy

1. **Extract Country Name**: Parse destination strings from Google Maps API format
   - `"Tokyo, Japan"` → extracts `"Japan"`
   - `"Paris, Île-de-France, France"` → extracts `"France"`
   - `"Singapore"` → uses as-is

2. **Check Cache**: Look up previously resolved country codes (in-memory cache)
   - Avoids repeated API calls for the same country
   - Persists across multiple destinations in the same request

3. **Query restcountries.com API**: Dynamic lookup for any country name
   - Exact match first: `/name/{country}?fullText=true`
   - Partial match fallback: `/name/{country}`
   - Handles all 249+ countries and territories
   - Works with country variants (e.g., "UK", "United Kingdom", "Great Britain")

4. **Static Mapping Fallback**: Use built-in mapping if API is unavailable
   - Covers 100+ countries and major cities
   - Used when restcountries.com is down or network issues occur

5. **Cache Result**: Store the result for future lookups

### Benefits

✅ **Universal Coverage**: Works with ANY country name via restcountries.com API
✅ **Google Maps Compatible**: Automatically extracts country from full destination strings
✅ **Performance**: Caching prevents redundant API calls
✅ **Reliability**: Falls back to static mapping if API fails
✅ **Accurate**: Uses standardized restcountries.com data

### Usage Examples

```python
# Google Maps API format destinations
agent._get_country_code("Tokyo, Japan")                          # Returns "JP"
agent._get_country_code("Paris, Île-de-France, France")          # Returns "FR"
agent._get_country_code("New York, NY, United States")           # Returns "US"
agent._get_country_code("Singapore")                             # Returns "SG"

# Direct country names (from citizenship field)
agent._get_country_code("United States")                         # Returns "US"
agent._get_country_code("China")                                 # Returns "CN"
agent._get_country_code("United Kingdom")                        # Returns "GB"

# Works with any country, even uncommon ones
agent._get_country_code("Reykjavik, Iceland")                    # Returns "IS"
agent._get_country_code("Ljubljana, Slovenia")                   # Returns "SI"
agent._get_country_code("Tallinn, Estonia")                      # Returns "EE"
```

### Data Sources

- **User Citizenship**: Guaranteed to be correct via restcountries.com API
- **Trip Destinations**: Guaranteed to have country name after last comma via Google Maps API
- **Static Fallback**: 100+ pre-mapped countries and cities for offline operation

## Error Handling

### API Failures
If the visa API fails (network error, rate limit, etc.):
- Falls back to generic "Research visa requirements for [Destination]" tasks
- Logs error for debugging
- Does not block task generation

### Invalid Country Mappings
If a destination cannot be mapped to a country code:
- Skips that destination
- Logs warning
- Continues with other destinations

### Missing User Citizenship
If user citizenship is not set:
- Falls back to generic visa tasks
- Logs warning
- Task generation continues normally

## Testing

The implementation has been tested with:
- ✅ Visa-free entries (USA → Japan)
- ✅ Visa required (India → UK)
- ✅ Visa on arrival (China → Indonesia)
- ✅ Mandatory registrations (e-Arrival)
- ✅ Multiple cities in same country (deduplication)
- ✅ API failure scenarios (fallback behavior)
- ✅ Country/city mapping (100+ locations)

## Usage Example

```python
from services.agents.sub_agents.visa_agent import get_visa_agent

# Get the visa agent
agent = get_visa_agent()

# Prepare trip data
trip_data = {
    "destinations": ["Tokyo", "Bangkok", "Singapore"],
    "start_date": "2025-06-01",
    "end_date": "2025-06-20"
}

# Generate visa tasks
tasks = agent.generate_visa_tasks(trip_data, user_citizenship="United States")

# Tasks will include appropriate visa requirements for each destination
```

## Integration with Task Agent

The Task Agent automatically calls the Visa Agent when generating tasks:

```python
# In TaskAgent.generate_tasks()
if user_citizenship:
    visa_agent = get_visa_agent()
    visa_tasks = visa_agent.generate_visa_tasks(trip_data, user_citizenship)
    
    # Filter out generic visa tasks from LLM
    general_tasks = [
        task for task in llm_tasks 
        if task.get("category") != "visa"
    ]
    
    # Combine specific visa tasks with general tasks
    all_tasks = visa_tasks + general_tasks
```

## Future Enhancements

Potential improvements for the future:
- [ ] Cache API responses to reduce API calls
- [ ] Add support for transit visa requirements
- [ ] Include vaccination requirements integration
- [ ] Add visa processing time estimates
- [ ] Support for multiple passport/citizenships
- [ ] Real-time visa policy updates
- [ ] Cost estimates for visa applications
- [ ] Document checklist for visa applications

## Support

For issues or questions:
1. Check the logs for error messages
2. Verify RAPIDAPI_SECRET is correctly set
3. Ensure user citizenship is set in the database
4. Test with the fallback behavior (without API key)

## License

Part of the Backpacking Assistant Agent project.
