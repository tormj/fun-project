from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from src.surveillance_simulator.core.models import SimulationState
from src.surveillance_simulator.api.dependencies import get_simulation_engine
import time

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, data: dict):
        for connection in self.active_connections:
            await connection.send_json(data)

manager = ConnectionManager()

async def simulation_update_handler(state: SimulationState):
    """Handler for simulation updates to broadcast to all WebSocket clients."""
    await manager.broadcast(state.model_dump())

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    print("WebSocket connection attempting to connect...")
    try:
        # Get simulation engine directly from app state instead of using dependency
        simulation = websocket.app.state.simulation
        
        await manager.connect(websocket)
        print(f"WebSocket connected. Active connections: {len(manager.active_connections)}")
        
        # Add WebSocket connection as listener for simulation updates
        simulation.add_listener(simulation_update_handler)
        print(f"Listener added. Total listeners: {len(simulation.listeners)}")
        
        # Send initial state
        state = SimulationState(
            sensors=simulation.sensors,
            detected_objects=simulation.detected_objects,
            timestamp=time.time()
        )
        await websocket.send_json(state.model_dump())
        print("Initial state sent to WebSocket client")
        
        try:
            while True:
                # Keep connection alive and print periodic debug info
                message = await websocket.receive_text()
                if message == "ping":
                    await websocket.send_text("pong")
                    print("Ping-pong exchanged with client")
        except WebSocketDisconnect:
            print("WebSocket disconnected")
            manager.disconnect(websocket)
            simulation.remove_listener(simulation_update_handler)
    except Exception as e:
        print(f"Error in WebSocket endpoint: {e}")
        import traceback
        traceback.print_exc()