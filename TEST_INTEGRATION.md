# Integration Testing Guide

## Quick Test Checklist

### ✅ Prerequisites
- [ ] Backend is running on port 8000
- [ ] Frontend is running on port 3000
- [ ] Backend has GEMINI_API_KEY in `.env`
- [ ] Frontend has NEXT_PUBLIC_API_URL in `.env.local`

### ✅ Backend Tests

#### Test 1: Backend Health Check
```bash
curl http://localhost:8000/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "service": "backpacking-assistant-api",
  "environment": "development"
}
```

#### Test 2: Agent Health Check
```bash
curl http://localhost:8000/agents/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "service": "agents",
  "orchestrator": "langgraph",
  "active_agents": ["name_description"]
}
```

#### Test 3: Direct Agent Call
```bash
curl -X POST http://localhost:8000/agents/generate-trip-name \
  -H "Content-Type: application/json" \
  -d '{
    "destinations": ["Tokyo", "Kyoto"],
    "start_point": "San Francisco",
    "end_point": "Osaka",
    "start_date": "2024-06-01",
    "end_date": "2024-06-15",
    "flexible_dates": false,
    "adults_count": 2,
    "children_count": 0,
    "preferences": ["culture", "food", "temples"],
    "transportation": ["train", "walking"],
    "budget": 3000,
    "currency": "USD"
  }'
```

**Expected Response:**
```json
{
  "name": "Tokyo to Osaka: Temple & Culture Trail",
  "description": "Explore ancient temples, savor exquisite cuisine, and experience Japanese culture across three iconic cities."
}
```

**Timing:** Should complete in 2-5 seconds

#### Test 4: Agent Test Script
```bash
cd apps/api
python test_agent.py
```

**Expected Output:**
```
🧪 Testing Name & Description Agent...

✅ Results:
Status: completed
Trip Name: [AI-generated name]
Description: [AI-generated description]
Completed Agents: initialize, name_description_agent, finalize

🎉 Test passed successfully!
```

### ✅ Frontend Tests

#### Test 5: Frontend Environment
```bash
cd apps/web
cat .env.local | grep NEXT_PUBLIC_API_URL
```

**Expected Output:**
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

#### Test 6: End-to-End Trip Creation

**Manual Test Steps:**

1. **Open Browser**
   ```
   http://localhost:3000
   ```

2. **Sign In**
   - Use Google OAuth or test credentials

3. **Navigate to Create Trip**
   - Click "Create New Trip" or the + card

4. **Fill Trip Details:**
   - **Destinations:** Tokyo, Kyoto
   - **Start Point:** San Francisco
   - **End Point:** Osaka
   - **Dates:** Any future dates (e.g., June 1-15, 2024)
   - **Travelers:** 2 adults, 0 children
   - **Preferences:** culture, food, temples
   - **Transportation:** train, walking
   - **Budget:** 3000 USD

5. **Submit Form**
   - Complete all steps in the wizard
   - Click final "Create Trip" button

6. **Verify Backend Call**
   - Watch backend terminal
   - Should see: `POST /agents/generate-trip-name HTTP/1.1" 200 OK`

7. **Check Result**
   - Trip should appear in dashboard
   - Should have AI-generated name
   - Should have engaging description

**Expected Name Examples:**
- "Tokyo to Osaka: A Cultural Journey"
- "San Francisco to Osaka: Temple & Tech"
- "Japan Exploration: Culture & Cuisine"

**Expected Description Pattern:**
- One sentence
- Mentions key aspects (culture, food, temples)
- Engaging and descriptive
- References the destinations

### ✅ Integration Tests

#### Test 7: Error Handling

**Test Backend Down:**
1. Stop backend server
2. Try to create trip in frontend
3. Should see fallback name: "Trip to Tokyo"
4. Should still create trip successfully

**Test Invalid Data:**
```bash
curl -X POST http://localhost:8000/agents/generate-trip-name \
  -H "Content-Type: application/json" \
  -d '{"destinations": []}'
```

**Expected:** 422 Validation Error

#### Test 8: CORS

**From Browser Console (while on localhost:3000):**
```javascript
fetch('http://localhost:8000/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

**Expected:** Should return health status (no CORS error)

### ✅ Performance Tests

#### Test 9: Response Time
```bash
time curl -X POST http://localhost:8000/agents/generate-trip-name \
  -H "Content-Type: application/json" \
  -d '{"destinations":["Paris"],"start_date":"2024-07-01","end_date":"2024-07-10","flexible_dates":false,"adults_count":2,"children_count":0,"preferences":[],"transportation":[],"budget":2000,"currency":"EUR"}'
```

**Expected:** 2-5 seconds total time

#### Test 10: Multiple Requests
```bash
# Test 3 requests in sequence
for i in {1..3}; do
  echo "Request $i:"
  curl -X POST http://localhost:8000/agents/generate-trip-name \
    -H "Content-Type: application/json" \
    -d '{"destinations":["Paris"],"start_date":"2024-07-01","end_date":"2024-07-10","flexible_dates":false,"adults_count":2,"children_count":0,"preferences":["food"],"transportation":["train"],"budget":2000,"currency":"EUR"}' \
    -w "\nTime: %{time_total}s\n\n"
done
```

**Expected:** All should succeed, similar response times

## Automated Test Script

Create and run this test script:

```bash
#!/bin/bash
# test_integration.sh

echo "🧪 Integration Test Suite"
echo "========================="

# Test 1: Backend Health
echo -e "\n📍 Test 1: Backend Health"
HEALTH=$(curl -s http://localhost:8000/health)
if echo "$HEALTH" | grep -q "healthy"; then
  echo "✅ PASS"
else
  echo "❌ FAIL"
  exit 1
fi

# Test 2: Agent Health
echo -e "\n📍 Test 2: Agent Health"
AGENT_HEALTH=$(curl -s http://localhost:8000/agents/health)
if echo "$AGENT_HEALTH" | grep -q "name_description"; then
  echo "✅ PASS"
else
  echo "❌ FAIL"
  exit 1
fi

# Test 3: Generate Trip Name
echo -e "\n📍 Test 3: Generate Trip Name"
RESPONSE=$(curl -s -X POST http://localhost:8000/agents/generate-trip-name \
  -H "Content-Type: application/json" \
  -d '{
    "destinations": ["Tokyo"],
    "start_date": "2024-06-01",
    "end_date": "2024-06-10",
    "flexible_dates": false,
    "adults_count": 2,
    "children_count": 0,
    "preferences": ["culture"],
    "transportation": ["train"],
    "budget": 3000,
    "currency": "USD"
  }')

if echo "$RESPONSE" | grep -q "name"; then
  echo "✅ PASS"
  echo "Response: $RESPONSE"
else
  echo "❌ FAIL"
  echo "Response: $RESPONSE"
  exit 1
fi

echo -e "\n🎉 All tests passed!"
```

**Run it:**
```bash
chmod +x test_integration.sh
./test_integration.sh
```

## Common Issues & Solutions

### Issue 1: Connection Refused
**Symptom:** `Failed to connect to localhost:8000`
**Solution:** 
```bash
# Check if backend is running
lsof -i :8000

# If not, start it
cd apps/api && python main.py
```

### Issue 2: CORS Error
**Symptom:** `Access to fetch blocked by CORS policy`
**Solution:**
- Verify frontend URL in backend CORS config
- Check `apps/api/main.py` allows `http://localhost:3000`

### Issue 3: 422 Validation Error
**Symptom:** `Unprocessable Entity`
**Solution:**
- Check request body matches schema
- Ensure all required fields are present
- Verify data types (numbers as numbers, not strings)

### Issue 4: Gemini API Error
**Symptom:** `Error generating trip name`
**Solution:**
- Verify GEMINI_API_KEY in backend `.env`
- Check API key is valid
- Check API quota/limits

## Test Results Log

Document your test results:

| Test | Status | Time | Notes |
|------|--------|------|-------|
| Backend Health | ⬜ | | |
| Agent Health | ⬜ | | |
| Direct Agent Call | ⬜ | | |
| Agent Test Script | ⬜ | | |
| Frontend Environment | ⬜ | | |
| E2E Trip Creation | ⬜ | | |
| Error Handling | ⬜ | | |
| CORS | ⬜ | | |
| Response Time | ⬜ | | |
| Multiple Requests | ⬜ | | |

## Success Criteria

✅ All backend health checks pass
✅ Agent generates creative, unique names
✅ Frontend successfully calls backend API
✅ Trip creation works end-to-end
✅ Error handling gracefully degrades
✅ Response time < 10 seconds
✅ No CORS errors
✅ No linter errors

## Next Steps After Testing

Once all tests pass:

1. **Deploy Backend**
   - Railway, Render, or Cloud Run
   - Set environment variables
   - Update frontend API URL

2. **Deploy Frontend**
   - Vercel or similar
   - Set NEXT_PUBLIC_API_URL to production backend

3. **Monitor**
   - Set up error tracking
   - Monitor API response times
   - Track Gemini API usage

4. **Optimize**
   - Add caching for common queries
   - Implement rate limiting
   - Add request queuing if needed

Happy Testing! 🚀
