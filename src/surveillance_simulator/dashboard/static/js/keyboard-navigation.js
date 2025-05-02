document.addEventListener('DOMContentLoaded', function() {
    // Get the canvas element
    const canvas = document.getElementById('simulationCanvas');
    if (!canvas) return;
    
    // Create navigation controls
    const navControls = document.createElement('div');
    navControls.classList.add('navigation-controls');
    navControls.style.position = 'fixed';
    navControls.style.bottom = '20px';
    navControls.style.right = '20px';
    navControls.style.backgroundColor = 'rgba(0,0,0,0.7)';
    navControls.style.padding = '10px';
    navControls.style.borderRadius = '5px';
    navControls.style.zIndex = '1000';
    navControls.innerHTML = `
        <div style="margin-bottom:10px; color:white; text-align:center">Navigation Controls</div>
        <div style="display:grid; grid-template-columns:1fr 1fr 1fr; grid-gap:5px;">
            <button id="navZoomIn" style="grid-column:2">+</button>
            <button id="navUp" style="grid-column:2">↑</button>
            <button id="navLeft">←</button>
            <button id="navCenter" style="background-color:#555">C</button>
            <button id="navRight">→</button>
            <button id="navZoomOut" style="grid-column:2">-</button>
            <button id="navDown" style="grid-column:2">↓</button>
        </div>
    `;
    document.body.appendChild(navControls);
    
    // Style the buttons
    const buttons = navControls.querySelectorAll('button');
    buttons.forEach(button => {
        button.style.width = '40px';
        button.style.height = '40px';
        button.style.fontSize = '16px';
        button.style.fontWeight = 'bold';
        button.style.cursor = 'pointer';
    });
    
    // Global variables for transformation
    let offsetX = 0;
    let offsetY = 0;
    let zoom = 1;
    const moveIncrement = 50;
    const zoomIncrement = 0.1;
    
    // Navigation handlers
    document.getElementById('navUp').addEventListener('click', () => {
        offsetY += moveIncrement / zoom;
        applyTransform();
    });
    
    document.getElementById('navDown').addEventListener('click', () => {
        offsetY -= moveIncrement / zoom;
        applyTransform();
    });
    
    document.getElementById('navLeft').addEventListener('click', () => {
        offsetX += moveIncrement / zoom;
        applyTransform();
    });
    
    document.getElementById('navRight').addEventListener('click', () => {
        offsetX -= moveIncrement / zoom;
        applyTransform();
    });
    
    document.getElementById('navZoomIn').addEventListener('click', () => {
        zoom = Math.min(5, zoom + zoomIncrement);
        applyTransform();
    });
    
    document.getElementById('navZoomOut').addEventListener('click', () => {
        zoom = Math.max(0.1, zoom - zoomIncrement);
        applyTransform();
    });
    
    document.getElementById('navCenter').addEventListener('click', () => {
        offsetX = 0;
        offsetY = 0;
        zoom = 1;
        applyTransform();
    });
    
    // Handle keyboard controls too
    document.addEventListener('keydown', (e) => {
        switch(e.key) {
            case 'ArrowUp':
                offsetY += moveIncrement / zoom;
                break;
            case 'ArrowDown':
                offsetY -= moveIncrement / zoom;
                break;
            case 'ArrowLeft':
                offsetX += moveIncrement / zoom;
                break;
            case 'ArrowRight':
                offsetX -= moveIncrement / zoom;
                break;
            case '+':
            case '=':
                zoom = Math.min(5, zoom + zoomIncrement);
                break;
            case '-':
            case '_':
                zoom = Math.max(0.1, zoom - zoomIncrement);
                break;
            case 'c':
            case 'C':
                offsetX = 0;
                offsetY = 0;
                zoom = 1;
                break;
            default:
                return;
        }
        applyTransform();
        e.preventDefault();
    });
    
    // Apply transform to canvas
    function applyTransform() {
        // Use direct canvas transformation if possible
        const ctx = canvas.getContext('2d');
        if (window.simulationTransform) {
            // If we can access the global rendering function
            window.simulationTransform.offsetX = offsetX;
            window.simulationTransform.offsetY = offsetY;
            window.simulationTransform.zoom = zoom;
            
            // Force a redraw if possible
            if (window.renderSimulation) {
                window.renderSimulation();
            }
        } else {
            // Fallback to CSS transforms
            canvas.style.transform = `matrix(${zoom}, 0, 0, ${zoom}, ${offsetX}, ${offsetY})`;
            canvas.style.transformOrigin = 'center';
        }
        
        // Update transform info
        updateTransformInfo();
    }
    
    // Show transform information
    const transformInfo = document.createElement('div');
    transformInfo.style.position = 'fixed';
    transformInfo.style.top = '10px';
    transformInfo.style.right = '10px';
    transformInfo.style.backgroundColor = 'rgba(0,0,0,0.7)';
    transformInfo.style.color = 'white';
    transformInfo.style.padding = '5px';
    transformInfo.style.borderRadius = '3px';
    transformInfo.style.fontSize = '12px';
    transformInfo.style.fontFamily = 'monospace';
    document.body.appendChild(transformInfo);
    
    function updateTransformInfo() {
        transformInfo.innerHTML = `X: ${offsetX.toFixed(0)} Y: ${offsetY.toFixed(0)} Zoom: ${zoom.toFixed(1)}x`;
    }
    
    // Initialize transform display
    updateTransformInfo();
    
    // Create globals so other scripts can access
    window.simulationTransform = {
        offsetX: offsetX,
        offsetY: offsetY,
        zoom: zoom
    };
    
    console.log('Keyboard navigation initialized');
}); 