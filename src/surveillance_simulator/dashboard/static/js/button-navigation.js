document.addEventListener('DOMContentLoaded', function() {
    // Create a dedicated navigation panel
    const navPanel = document.createElement('div');
    navPanel.id = 'navigationPanel';
    navPanel.style.position = 'fixed';
    navPanel.style.right = '20px';
    navPanel.style.bottom = '20px';
    navPanel.style.backgroundColor = '#333';
    navPanel.style.padding = '15px';
    navPanel.style.borderRadius = '10px';
    navPanel.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)';
    navPanel.style.zIndex = '1000';
    navPanel.style.display = 'flex';
    navPanel.style.flexDirection = 'column';
    navPanel.style.gap = '10px';
    
    // Create navigation HTML
    navPanel.innerHTML = `
        <div style="color:white; font-weight:bold; text-align:center; margin-bottom:10px;">NAVIGATION</div>
        
        <div style="display:grid; grid-template-columns:1fr 1fr 1fr; grid-gap:5px;">
            <button id="navZoomIn" style="grid-column:2; height:40px; font-size:24px; font-weight:bold;">+</button>
            <button id="navUp" style="grid-column:2; height:40px; font-size:24px;">⬆️</button>
            <button id="navLeft" style="height:40px; font-size:24px;">⬅️</button>
            <button id="navReset" style="height:40px; font-size:16px; background-color:#555;">RESET</button>
            <button id="navRight" style="height:40px; font-size:24px;">➡️</button>
            <button id="navDown" style="grid-column:2; height:40px; font-size:24px;">⬇️</button>
            <button id="navZoomOut" style="grid-column:2; height:40px; font-size:24px; font-weight:bold;">-</button>
        </div>
        
        <div id="navInfo" style="color:white; text-align:center; margin-top:5px; font-family:monospace;">
            Position: (0,0) Zoom: 1.0x
        </div>
    `;
    
    document.body.appendChild(navPanel);
    
    // Get the canvas and context
    const canvas = document.getElementById('simulationCanvas');
    const ctx = canvas.getContext('2d');
    
    // Navigation state
    let canvasTransform = {
        x: 0,
        y: 0,
        zoom: 1.0
    };
    
    // Function to update the canvas transformation
    function updateCanvas() {
        // Store transform for use in rendering
        window.canvasTransform = canvasTransform;
        
        // Update the info display
        document.getElementById('navInfo').textContent = 
            `Position: (${Math.round(canvasTransform.x)},${Math.round(canvasTransform.y)}) Zoom: ${canvasTransform.zoom.toFixed(1)}x`;
        
        // Force redraw - try multiple approaches
        if (typeof window.renderSimulation === 'function') {
            window.renderSimulation();
        } else {
            // Modify the canvas directly as a workaround
            canvas.style.transformOrigin = 'center';
            canvas.style.transform = `translate(${canvasTransform.x}px, ${canvasTransform.y}px) scale(${canvasTransform.zoom})`;
            
            // Trigger a resize event which might cause a redraw
            window.dispatchEvent(new Event('resize'));
        }
    }
    
    // Set up the original render function to use our transform
    const originalRenderFunction = window.renderSimulation;
    window.renderSimulation = function() {
        ctx.save();
        
        // Clear the entire canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Apply transformations
        ctx.translate(canvas.width/2, canvas.height/2);
        ctx.scale(canvasTransform.zoom, canvasTransform.zoom);
        ctx.translate(-canvas.width/2 + canvasTransform.x/canvasTransform.zoom, 
                     -canvas.height/2 + canvasTransform.y/canvasTransform.zoom);
        
        // Call the original render function if it exists
        if (typeof originalRenderFunction === 'function') {
            originalRenderFunction();
        }
        
        ctx.restore();
    };
    
    // Attach event handlers to the buttons
    document.getElementById('navUp').addEventListener('click', function() {
        canvasTransform.y += 50;
        updateCanvas();
    });
    
    document.getElementById('navDown').addEventListener('click', function() {
        canvasTransform.y -= 50;
        updateCanvas();
    });
    
    document.getElementById('navLeft').addEventListener('click', function() {
        canvasTransform.x += 50;
        updateCanvas();
    });
    
    document.getElementById('navRight').addEventListener('click', function() {
        canvasTransform.x -= 50;
        updateCanvas();
    });
    
    document.getElementById('navZoomIn').addEventListener('click', function() {
        canvasTransform.zoom = Math.min(5, canvasTransform.zoom + 0.2);
        updateCanvas();
    });
    
    document.getElementById('navZoomOut').addEventListener('click', function() {
        canvasTransform.zoom = Math.max(0.2, canvasTransform.zoom - 0.2);
        updateCanvas();
    });
    
    document.getElementById('navReset').addEventListener('click', function() {
        canvasTransform.x = 0;
        canvasTransform.y = 0;
        canvasTransform.zoom = 1.0;
        updateCanvas();
    });
    
    // Initialize
    updateCanvas();
    
    console.log('Button navigation panel initialized');
}); 