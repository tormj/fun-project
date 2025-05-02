from fastapi import Depends, Request
from src.surveillance_simulator.core.simulation import SimulationEngine

async def get_simulation_engine(request: Request) -> SimulationEngine:
    """Dependency to get the simulation engine from app state."""
    return request.app.state.simulation