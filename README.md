# Python Project

This is a Python project template with a basic structure and development tools set up.

## Setup

1. Create a virtual environment:
```bash
python -m venv venv
```

2. Activate the virtual environment:
- On macOS/Linux:
```bash
source venv/bin/activate
```
- On Windows:
```bash
.\venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

## Project Structure

```
.
├── README.md
├── requirements.txt
├── src/
│   └── surveillance_simulator/
│       ├── api/
│       │   ├── routes/
│       │   ├── dependencies.py
│       │   └── main.py
│       ├── core/
│       │   ├── detection.py
│       │   ├── models.py
│       │   ├── sensors.py
│       │   └── simulation.py
│       └── dashboard/
│           ├── static/
│           │   ├── css/
│           │   └── js/
│           └── templates/
└── tests/
    ├── __init__.py
    └── test_main.py
```


## Dependencies
- FastAPI - Modern, high-performance web framework for building APIs
- Uvicorn - ASGI server for running FastAPI applications
- Pydantic - Data validation and settings management
- WebSockets - Real-time communication between server and clients
- Jinja2 - HTML template engine

## Features
- Real-time simulation of autonomous surveillance systems
- Multiple sensor types with different capabilities (drones, towers, border units)
- Object detection with varying confidence levels
- WebSocket-based real-time updates
- Configurable simulation parameters

## Technologies Used
- Python - Core programming language
- FastAPI - API framework
- Pydantic - Data validation
- HTML, CSS, and JavaScript - Front-end development
- WebSockets - Real-time communication
- Asynchronous programming - For non-blocking operations

## How to Use
1. Click "Initialize Simulation" to start the simulation
2. Adjust the number of sensors and objects using the input fields
3. Control the simulation speed with the slider
4. Navigate the map using the navigation controls
5. Monitor sensor status and detections in the right panel

- **Working Features:**
  - Sensor initialization and visualization
  - Object detection and tracking
  - Real-time simulation updates
  - Basic visualization of the simulation area

- **Known Issues:**
  - Interactive navigation (pan/zoom) may not function properly in all browsers
  - Object detection ranges might need fine-tuning
  - Performance may degrade with large numbers of objects/sensors
  - Some UI elements might not be fully responsive

## Purpose
This project was created as a personal learning exercise to explore:
- Asynchronous programming in Python with FastAPI
- Real-time data streaming with WebSockets
- Interactive visualizations with HTML Canvas
- Simulation algorithms for autonomous systems

## Screenshots
<img width="1649" alt="image" src="https://github.com/user-attachments/assets/94b7b562-21c3-456d-99fc-c7f262274a80" />


