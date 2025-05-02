import math
import random
import uuid
from typing import List, Dict, Any
from .models import Sensor, DetectedObject, Position

async def perform_detections(
    sensors: List[Sensor],
    objects_in_area: List[Dict[str, Any]]
) -> List[DetectedObject]:
    """Perform object detection from all sensors."""
    detected_objects = []
    
    if not objects_in_area:
        print("Warning: No objects available for detection")
        return detected_objects
        
    if not sensors:
        print("Warning: No sensors available for detection")
        return detected_objects
        
    print(f"Attempting detection with {len(sensors)} sensors and {len(objects_in_area)} objects")
    
    for sensor in sensors:
        for obj in objects_in_area:
            obj_position = Position(x=obj["position"]["x"], y=obj["position"]["y"])
            
            # Calculate distance between sensor and object
            distance = math.sqrt(
                (sensor.position.x - obj_position.x) ** 2 +
                (sensor.position.y - obj_position.y) ** 2
            )
            
            # Increase sensor range temporarily to see if detection works
            effective_range = sensor.range * 1.5  # Make range 50% larger to help with initial detections
            
            # Check if object is within sensor range
            if distance <= effective_range:
                # Calculate detection confidence based on distance and randomness
                max_confidence = 0.95
                distance_factor = 1 - (distance / effective_range)
                # Increase the base confidence to make detections more likely
                confidence = max_confidence * distance_factor * (0.8 + random.random() * 0.2)
                
                # Lower the confidence threshold to make detections more likely
                if confidence > 0.1:  # Reduced from 0.2 to 0.1
                    detected_object = DetectedObject(
                        id=str(uuid.uuid4()),
                        type=obj["type"],
                        position=obj_position,
                        confidence=confidence,
                        detected_by=sensor.id
                    )
                    detected_objects.append(detected_object)
                    print(f"Detected {obj['type']} with confidence {confidence:.2f} by sensor {sensor.id}")
    
    print(f"Total objects detected: {len(detected_objects)}")
    return detected_objects