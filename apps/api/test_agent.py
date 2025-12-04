"""Simple test script to verify the agent setup."""

import asyncio
import os
from dotenv import load_dotenv
from services.agents.super_agent import get_orchestrator

# Load environment variables
load_dotenv()


async def test_name_description_generation():
    """Test the name and description generation agent."""

    print("🧪 Testing Name & Description Agent...")

    # Sample trip data
    trip_data = {
        "destinations": ["Tokyo", "Kyoto", "Osaka"],
        "start_point": "San Francisco",
        "end_point": "Osaka",
        "start_date": "2024-06-01",
        "end_date": "2024-06-15",
        "flexible_dates": False,
        "adults_count": 2,
        "children_count": 0,
        "preferences": ["culture", "food", "hiking", "temples"],
        "transportation": ["train", "walking"],
        "budget": 3000,
        "currency": "USD"
    }

    # Get orchestrator and process trip
    orchestrator = get_orchestrator()
    result = await orchestrator.process_trip(trip_data, user_id="test_user_123")

    # Print results
    print("\n✅ Results:")
    print(f"Status: {result['status']}")
    print(f"Trip Name: {result['name']}")
    print(f"Description: {result['description']}")
    print(f"Completed Agents: {', '.join(result['completed_agents'])}")

    if result.get('errors'):
        print(f"⚠️  Errors: {', '.join(result['errors'])}")

    return result


async def main():
    """Main test function."""
    print("=" * 60)
    print("Backpacking Assistant Agent Test")
    print("=" * 60)

    # Check environment variables
    if not os.getenv("GEMINI_API_KEY"):
        print("❌ Error: GEMINI_API_KEY not set in environment")
        return

    print("✅ Environment variables loaded")

    # Run test
    try:
        result = await test_name_description_generation()

        if result['status'] == 'completed' and result['name']:
            print("\n🎉 Test passed successfully!")
        else:
            print("\n❌ Test failed")

    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
