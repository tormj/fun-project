from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Dict, Any
import time

from src.surveillance_simulator.core.models import SimulationState
from src.surveillance_simulator.api.dependencies import get_simulation_engine

router = APIRouter(prefix="/simulation", tags=["simulation"])

class SimulationConfig(BaseModel):
    num_sensors: int = 5
    num_objects: int = 20
    simulation_speed: float = 1.0

@router.post("/initialize")
async def initialize_simulation(
    config: SimulationConfig,
    simulation = Depends(get_simulation_engine)
):
    """Initialize the simulation with the given configuration."""
    print("=" * 50)
    print("INITIALIZE ROUTE CALLED")
    print(f"Config: {config}")
    print("=" * 50)
    
    await simulation.initialize_simulation(
        num_sensors=config.num_sensors,
        num_objects=config.num_objects
    )
    simulation.simulation_speed = config.simulation_speed
    
    print("=" * 50)
    print(f"AFTER INITIALIZATION: {len(simulation.sensors)} sensors")
    print("=" * 50)
    
    print(f"Object positions after initialization: {[{obj['id']: [round(obj['position']['x']), round(obj['position']['y'])]} for obj in simulation.objects_in_area[:3]]}")
    return {"status": "initialized"}

@router.get("/state")
async def get_simulation_state(
    simulation = Depends(get_simulation_engine)
) -> SimulationState:
    """Get the current state of the simulation."""
    return SimulationState(
        sensors=simulation.sensors,
        detected_objects=simulation.detected_objects,
        timestamp=simulation.last_update
    )

@router.get("/all-objects")
async def get_all_objects(
    simulation = Depends(get_simulation_engine)
):
    """Get all objects in the simulation area, regardless of detection status."""
    objects = []
    for obj in simulation.objects_in_area:
        objects.append({
            "id": obj["id"],
            "type": obj["type"],
            "position": {
                "x": obj["position"]["x"],
                "y": obj["position"]["y"]
            },
            "heading": obj["heading"],
            "speed": obj["speed"]
        })
    return {"objects": objects}

@router.get("/debug")
async def debug_simulation(
    simulation = Depends(get_simulation_engine)
):
    """Get debug information about the simulation."""
    return {
        "is_running": simulation.running,
        "is_initialized": simulation.initialized,
        "simulation_speed": simulation.simulation_speed,
        "last_update": simulation.last_update,
        "num_sensors": len(simulation.sensors),
        "num_objects": len(simulation.objects_in_area),
        "num_detections": len(simulation.detected_objects),
        "num_listeners": len(simulation.listeners),
        "timestamp": time.time()
    }