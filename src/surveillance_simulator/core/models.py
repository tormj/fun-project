from enum import Enum
from pydantic import BaseModel
from typing import List

class SensorType(str, Enum):
    DRONE = "drone"
    TOWER = "tower" 
    BORDER_UNIT = "border_unit"

class ObjectType(str, Enum):
    PERSON = "person"
    DRONE = "drone"
    VEHICLE = "vehicle"

class Position(BaseModel):
    x: float
    y: float

class Sensor(BaseModel):
    id: str
    type: SensorType
    position: Position
    range: float
    battery_level: float = 100.0
    signal_quality: float = 100.0
    system_load: float = 0.0
    heading: float = 0.0
    speed: float = 0.0

class DetectedObject(BaseModel):
    id: str
    type: ObjectType
    position: Position
    confidence: float
    detected_by: str

class SimulationState(BaseModel):
    sensors: List[Sensor]
    detected_objects: List[DetectedObject]
    timestamp: float