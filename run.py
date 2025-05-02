import uvicorn
import sys
from pathlib import Path

# Add the project root to the Python path
sys.path.append(str(Path(__file__).parent))

if __name__ == "__main__":
    uvicorn.run(
        "src.surveillance_simulator.api.main:app", 
        host="0.0.0.0", 
        port=8000, 
        reload=True
    )