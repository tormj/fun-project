import asyncio
import time
import math
import random
import uuid
from typing import List, Dict, Any
from .models import (
    Sensor, DetectedObject, Position, SensorType, 
    ObjectType, SimulationState
)
from .sensors import update_sensor_positions
from .detection import perform_detections

class SimulationEngine:
    def __init__(self):
        self.running = False
        self.initialized = False  # Add initialized flag
        self.simulation_speed = 1.0
        self.last_update = time.time()
        self.sensors: List[Sensor] = []
        self.objects_in_area: List[Dict[str, Any]] = []
        self.detected_objects: List[DetectedObject] = []
        self.map_boundaries = {
            "min_x": 0,
            "max_x": 1000,
            "min_y": 0,
            "max_y": 1000
        }
        self.listeners = []
    
    async def initialize_simulation(self, num_sensors: int = 5, num_objects: int = 20):
        """Initialize the simulation with random sensors and objects."""
        import random
        import math
        from src.surveillance_simulator.core.models import Sensor, Position, SensorType, ObjectType
        
        print(f"Initializing simulation with {num_sensors} sensors and {num_objects} objects")
        
        # Define map boundaries if not already set
        if not hasattr(self, 'map_boundaries'):
            self.map_boundaries = {
                "min_x": 0,
                "max_x": 1000,
                "min_y": 0,
                "max_y": 1000
            }
        
        # Create sensors
        self.sensors = []
        for i in range(num_sensors):
            sensor_type = random.choice(list(SensorType))
            
            # Different properties based on sensor type
            if sensor_type == SensorType.DRONE:
                speed = 5 + random.random() * 10
                range_val = 100 + random.random() * 100
            elif sensor_type == SensorType.TOWER:
                speed = 0  # Towers don't move
                range_val = 300 + random.random() * 200
            else:  # Border unit
                speed = 2 + random.random() * 5
                range_val = 150 + random.random() * 100
                
            self.sensors.append(
                Sensor(
                    id=f"sensor-{i}",
                    type=sensor_type,
                    position=Position(
                        x=random.uniform(self.map_boundaries["min_x"], self.map_boundaries["max_x"]),
                        y=random.uniform(self.map_boundaries["min_y"], self.map_boundaries["max_y"])
                    ),
                    range=range_val,
                    heading=random.random() * 2 * math.pi,
                    speed=speed
                )
            )
        
        # Create objects - place them closer to sensors to increase detection probability
        self.objects_in_area = []
        for i in range(num_objects):
            object_type = random.choice(list(ObjectType))
            
            # Choose a random sensor to place object near
            if self.sensors:
                reference_sensor = random.choice(self.sensors)
                # Position object within 50-80% of sensor range
                angle = random.random() * 2 * math.pi
                distance = reference_sensor.range * (0.5 + random.random() * 0.3)
                x = reference_sensor.position.x + math.cos(angle) * distance
                y = reference_sensor.position.y + math.sin(angle) * distance
                
                # Make sure coordinates are within map boundaries
                x = max(self.map_boundaries["min_x"], min(self.map_boundaries["max_x"], x))
                y = max(self.map_boundaries["min_y"], min(self.map_boundaries["max_y"], y))
            else:
                x = random.uniform(self.map_boundaries["min_x"], self.map_boundaries["max_x"])
                y = random.uniform(self.map_boundaries["min_y"], self.map_boundaries["max_y"])
            
            self.objects_in_area.append({
                "id": f"object-{i}",
                "type": object_type,
                "position": {
                    "x": x,
                    "y": y
                },
                "heading": random.random() * 2 * math.pi,
                "speed": 1 + random.random() * 5
            })
        
        print(f"Created {len(self.sensors)} sensors and {len(self.objects_in_area)} objects")
        
        # Set initialized flag to True
        self.initialized = True
        
        # Notify listeners of the new state
        state = SimulationState(
            sensors=self.sensors,
            detected_objects=self.detected_objects,
            timestamp=time.time()
        )
        
        for listener in self.listeners:
            try:
                await listener(state)
            except Exception as e:
                print(f"Error notifying listener: {e}")
    
    async def update(self):
        """Perform a single simulation update."""
        # Skip update if not initialized
        if not self.initialized:
            await asyncio.sleep(0.1)
            return
            
        current_time = time.time()
        time_delta = (current_time - self.last_update) * self.simulation_speed
        self.last_update = current_time
        
        # Update sensor positions
        self.sensors = await update_sensor_positions(
            self.sensors, 
            time_delta,
            self.map_boundaries
        )
        
        # Ensure objects are moving
        if not self.objects_in_area:
            print("Warning: No objects in area")
        else:
            print(f"Updating {len(self.objects_in_area)} objects")
        
        # Update object positions
        for obj in self.objects_in_area:
            obj["position"]["x"] += math.cos(obj["heading"]) * obj["speed"] * time_delta
            obj["position"]["y"] += math.sin(obj["heading"]) * obj["speed"] * time_delta
            
            # Handle boundaries
            if (obj["position"]["x"] < self.map_boundaries["min_x"] or 
                obj["position"]["x"] > self.map_boundaries["max_x"]):
                obj["heading"] = math.pi - obj["heading"]  # Reflect horizontally
                
            if (obj["position"]["y"] < self.map_boundaries["min_y"] or 
                obj["position"]["y"] > self.map_boundaries["max_y"]):
                obj["heading"] = -obj["heading"]  # Reflect vertically
                
            # Occasionally change heading
            if random.random() < 0.02:
                obj["heading"] += random.uniform(-0.5, 0.5)
        
        # Perform detections
        self.detected_objects = await perform_detections(self.sensors, self.objects_in_area)
        
        # Print detection information
        if self.sensors:
            print(f"Sample sensor positions: {[(s.id, round(s.position.x), round(s.position.y)) for s in self.sensors[:2]]}")
        if self.objects_in_area:
            print(f"Sample object positions: {[{k: round(v) if isinstance(v, float) else v for k, v in obj['position'].items()} for obj in self.objects_in_area[:2]]}")
        
        # Notify listeners with current state
        state = SimulationState(
            sensors=self.sensors,
            detected_objects=self.detected_objects,
            timestamp=current_time
        )
        
        print(f"Notifying {len(self.listeners)} listeners with {len(self.detected_objects)} detections")
        for listener in self.listeners:
            try:
                await listener(state)
            except Exception as e:
                print(f"Error notifying listener: {e}")
                import traceback
                traceback.print_exc()
        
        # In the update method, add more detailed logging:
        print(f"Time delta: {time_delta}, Simulation speed: {self.simulation_speed}")
        print(f"Object positions before update: {[{obj['id']: [round(obj['position']['x']), round(obj['position']['y'])]} for obj in self.objects_in_area[:3]]}")
        
        # After updating object positions, add:
        print(f"Object positions after update: {[{obj['id']: [round(obj['position']['x']), round(obj['position']['y'])]} for obj in self.objects_in_area[:3]]}")
    
    async def start(self):
        """Start the simulation loop."""
        print("=" * 50)
        print("Starting simulation loop")
        print("=" * 50)
        
        self.running = True
        self.last_update = time.time()
        update_count = 0
        
        while self.running:
            update_count += 1
            start_time = time.time()
            
            try:
                await self.update()
                
                if update_count % 10 == 0:  # Every 10 updates
                    if self.initialized:
                        current_time = time.time()
                        elapsed = current_time - start_time
                        print(f"Update {update_count} completed in {elapsed:.4f}s")
                        print(f"- Sensors: {len(self.sensors)}")
                        print(f"- Objects: {len(self.objects_in_area)}")
                        print(f"- Detections: {len(self.detected_objects)}")
                        print(f"- Listeners: {len(self.listeners)}")
                        
                        # Print a sample object position
                        if self.objects_in_area:
                            obj = self.objects_in_area[0]
                            print(f"- Sample object position: {obj['id']} at ({obj['position']['x']:.2f}, {obj['position']['y']:.2f})")
            except Exception as e:
                print(f"Error in simulation update: {e}")
                import traceback
                traceback.print_exc()
            
            # Sleep to maintain update rate but account for processing time
            elapsed = time.time() - start_time
            sleep_time = max(0.1 - elapsed, 0.01)  # Ensure we sleep at least 10ms
            await asyncio.sleep(sleep_time)
    
    def stop(self):
        """Stop the simulation loop."""
        self.running = False
    
    def add_listener(self, callback):
        """Add a listener to receive simulation updates."""
        self.listeners.append(callback)
        
    def remove_listener(self, callback):
        """Remove a listener."""
        if callback in self.listeners:
            self.listeners.remove(callback)