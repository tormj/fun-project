import asyncio
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from contextlib import asynccontextmanager
from pathlib import Path
import fastapi

from src.surveillance_simulator.core.simulation import SimulationEngine

# Get the base directory
BASE_DIR = Path(__file__).resolve().parent.parent

# Lifespan context manager for managing the simulation engine
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize simulation on startup
    app.state.simulation = SimulationEngine()
    
    # Start simulation in a background task
    simulation_task = asyncio.create_task(app.state.simulation.start())
    
    yield
    
    # On shutdown
    app.state.simulation.stop()
    await simulation_task

app = FastAPI(lifespan=lifespan)

# Mount static files
app.mount(
    "/static", 
    StaticFiles(directory=str(BASE_DIR / "dashboard" / "static")), 
    name="static"
)
templates = Jinja2Templates(directory=str(BASE_DIR / "dashboard" / "templates"))

# Import and include routers
from src.surveillance_simulator.api.routes import simulation, websocket
app.include_router(simulation.router)
app.include_router(websocket.router)


@app.get("/", response_class=fastapi.responses.HTMLResponse)
async def index(request: fastapi.Request):
    """Serve the dashboard HTML."""
    return templates.TemplateResponse("index.html", {"request": request})