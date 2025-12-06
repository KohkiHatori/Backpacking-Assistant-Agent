"""Super-agent orchestrator using LangGraph to coordinate sub-agents."""

from typing import Dict, Any, List
from langgraph.graph import StateGraph, END
from models.agent_state import SuperAgentState, TripData
from services.agents.sub_agents.name_description_agent import get_name_description_agent


class TripPlanningOrchestrator:
    """
    Super-agent that orchestrates multiple specialized sub-agents for trip planning.

    Currently implements:
    - Name & Description Generation Agent

    Future sub-agents:
    - Visa Requirements Agent
    - Vaccine Information Agent
    - Accommodation Recommendations Agent
    - Restaurant Recommendations Agent
    - Activities & Attractions Agent
    - Transportation Planning Agent
    """

    def __init__(self):
        """Initialize the orchestrator with a LangGraph workflow."""
        self.graph = self._build_graph()

    def _build_graph(self) -> StateGraph:
        """Build the LangGraph state graph for orchestration."""
        # Create the graph with SuperAgentState
        workflow = StateGraph(SuperAgentState)

        # Add nodes for each sub-agent
        workflow.add_node("initialize", self._initialize_state)
        # workflow.add_node("name_description_agent", self._run_name_description_agent)
        # Future nodes:
        # workflow.add_node("visa_agent", self._run_visa_agent)
        # workflow.add_node("vaccine_agent", self._run_vaccine_agent)
        # workflow.add_node("accommodation_agent", self._run_accommodation_agent)
        # workflow.add_node("restaurant_agent", self._run_restaurant_agent)
        workflow.add_node("finalize", self._finalize_state)

        # Define the workflow edges
        workflow.set_entry_point("initialize")
        # workflow.add_edge("initialize", "name_description_agent")

        # For now, go directly to finalize after name_description
        # In the future, this will be a conditional edge to route to other agents
        # workflow.add_edge("name_description_agent", "finalize")

        # Temporary direct edge for now since name_description_agent is commented out
        workflow.add_edge("initialize", "finalize")

        # Future edges (commented for now):
        # workflow.add_edge("name_description_agent", "visa_agent")
        # workflow.add_edge("visa_agent", "vaccine_agent")
        # workflow.add_edge("vaccine_agent", "accommodation_agent")
        # workflow.add_edge("accommodation_agent", "restaurant_agent")
        # workflow.add_edge("restaurant_agent", "finalize")

        workflow.add_edge("finalize", END)

        # Compile the graph
        return workflow.compile()

    def _initialize_state(self, state: SuperAgentState) -> SuperAgentState:
        """Initialize the orchestration state."""
        return {
            **state,
            "completed_agents": ["initialize"],
            "errors": [],
            "status": "processing"
        }

    def _run_name_description_agent(self, state: SuperAgentState) -> SuperAgentState:
        """Run the name and description generation sub-agent."""
        try:
            # Get the sub-agent
            agent = get_name_description_agent()

            # Convert trip_data to dict format if needed
            trip_data_dict = dict(state["trip_data"])

            # Generate name and description
            result = agent.generate_name_and_description(trip_data_dict)

            # Update state with results
            return {
                **state,
                "trip_name": result["name"],
                "trip_description": result["description"],
                "completed_agents": state.get("completed_agents", []) + ["name_description_agent"],
            }
        except Exception as e:
            error_msg = f"Name description agent failed: {str(e)}"
            print(error_msg)
            return {
                **state,
                "errors": state.get("errors", []) + [error_msg],
                "completed_agents": state.get("completed_agents", []) + ["name_description_agent"],
            }

    # Future sub-agent methods (placeholders)

    def _run_visa_agent(self, state: SuperAgentState) -> SuperAgentState:
        """Run the visa requirements sub-agent (to be implemented)."""
        # TODO: Implement visa requirements checking
        return {
            **state,
            "completed_agents": state.get("completed_agents", []) + ["visa_agent"],
        }

    def _run_vaccine_agent(self, state: SuperAgentState) -> SuperAgentState:
        """Run the vaccine information sub-agent (to be implemented)."""
        # TODO: Implement vaccine requirements checking
        return {
            **state,
            "completed_agents": state.get("completed_agents", []) + ["vaccine_agent"],
        }

    def _run_accommodation_agent(self, state: SuperAgentState) -> SuperAgentState:
        """Run the accommodation recommendations sub-agent (to be implemented)."""
        # TODO: Implement accommodation search and recommendations
        return {
            **state,
            "completed_agents": state.get("completed_agents", []) + ["accommodation_agent"],
        }

    def _run_restaurant_agent(self, state: SuperAgentState) -> SuperAgentState:
        """Run the restaurant recommendations sub-agent (to be implemented)."""
        # TODO: Implement restaurant search and recommendations
        return {
            **state,
            "completed_agents": state.get("completed_agents", []) + ["restaurant_agent"],
        }

    def _finalize_state(self, state: SuperAgentState) -> SuperAgentState:
        """Finalize the orchestration and determine final status."""
        has_errors = len(state.get("errors", [])) > 0

        return {
            **state,
            "status": "completed" if not has_errors else "failed",
            "completed_agents": state.get("completed_agents", []) + ["finalize"],
        }

    async def process_trip(self, trip_data: Dict[str, Any], user_id: str | None = None) -> Dict[str, Any]:
        """
        Process a trip through all sub-agents.

        Args:
            trip_data: Trip information dictionary
            user_id: Optional user ID for personalization

        Returns:
            Dictionary containing all generated information
        """
        # Initialize the state
        initial_state: SuperAgentState = {
            "trip_data": trip_data,
            "user_id": user_id,
            "trip_name": None,
            "trip_description": None,
            "visa_info": None,
            "vaccine_info": None,
            "accommodation_recommendations": None,
            "restaurant_recommendations": None,
            "completed_agents": [],
            "errors": [],
            "status": "pending"
        }

        # Run the graph
        final_state = await self.graph.ainvoke(initial_state)

        # Return the results
        return {
            "name": final_state.get("trip_name"),
            "description": final_state.get("trip_description"),
            "visa_info": final_state.get("visa_info"),
            "vaccine_info": final_state.get("vaccine_info"),
            "accommodation_recommendations": final_state.get("accommodation_recommendations"),
            "restaurant_recommendations": final_state.get("restaurant_recommendations"),
            "status": final_state.get("status"),
            "completed_agents": final_state.get("completed_agents", []),
            "errors": final_state.get("errors", [])
        }


# Singleton instance
_orchestrator_instance = None


def get_orchestrator() -> TripPlanningOrchestrator:
    """Get or create the singleton orchestrator instance."""
    global _orchestrator_instance
    if _orchestrator_instance is None:
        _orchestrator_instance = TripPlanningOrchestrator()
    return _orchestrator_instance
