import math
import random
from typing import List, Dict
from .models import Sensor, Position

async def update_sensor_positions(
    sensors: List[Sensor], 
    time_delta: float,
    map_boundaries: Dict[str, float]
) -> List[Sensor]:
    """Update the positions of all sensors based on their speed and heading."""
    updated_sensors = []
    
    for sensor in sensors:
        # Skip stationary sensors like towers
        if sensor.type == "tower" or sensor.speed == 0:
            updated_sensors.append(sensor)
            continue
            
        # Calculate new position based on heading and speed
        new_x = sensor.position.x + math.cos(sensor.heading) * sensor.speed * time_delta
        new_y = sensor.position.y + math.sin(sensor.heading) * sensor.speed * time_delta
        
        # Handle map boundaries
        new_x = max(map_boundaries["min_x"], min(map_boundaries["max_x"], new_x))
        new_y = max(map_boundaries["min_y"], min(map_boundaries["max_y"], new_y))
        
        # Update battery level and other properties
        battery_drain = time_delta * (0.05 + random.random() * 0.05)
        signal_quality = 80 + random.random() * 20
        system_load = 20 + random.random() * 30
        
        # Get model data but exclude all fields we're going to set explicitly
        sensor_data = sensor.model_dump(exclude={
            "position", 
            "battery_level", 
            "signal_quality", 
            "system_load"
        })
        
        # Create updated sensor with new position and other updated fields
        updated_sensors.append(
            Sensor(
                **sensor_data,
                position=Position(x=new_x, y=new_y),
                battery_level=max(0, sensor.battery_level - battery_drain),
                signal_quality=signal_quality,
                system_load=system_load
            )
        )
    
    return updated_sensors