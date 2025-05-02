document.addEventListener('DOMContentLoaded', function() {
    // Get the canvas element
    const canvas = document.getElementById('simulationCanvas');
    if (!canvas) {
        console.error('Canvas element not found!');
        return;
    }
    
    const ctx = canvas.getContext('2d');
    
    // Interaction state
    let cameraOffset = { x: 0, y: 0 };
    let cameraZoom = 1;
    let isDragging = false;
    let dragStart = { x: 0, y: 0 };
    
    console.log('Canvas interaction script loaded');
    
    // Add debug indicator
    const debugDiv = document.createElement('div');
    debugDiv.style.position = 'fixed';
    debugDiv.style.top = '10px';
    debugDiv.style.left = '10px';
    debugDiv.style.backgroundColor = 'rgba(0,0,0,0.7)';
    debugDiv.style.color = 'white';
    debugDiv.style.padding = '10px';
    debugDiv.style.borderRadius = '5px';
    debugDiv.style.zIndex = '1000';
    debugDiv.innerHTML = 'Interaction Ready: Click and drag to pan, scroll to zoom';
    document.body.appendChild(debugDiv);
    
    // Mouse event handlers
    canvas.addEventListener('mousedown', function(e) {
        console.log('Mouse down event detected');
        isDragging = true;
        dragStart.x = e.clientX - cameraOffset.x;
        dragStart.y = e.clientY - cameraOffset.y;
        debugDiv.innerHTML = `Drag started at (${e.clientX}, ${e.clientY})`;
    });
    
    canvas.addEventListener('mouseup', function() {
        console.log('Mouse up event detected');
        isDragging = false;
        debugDiv.innerHTML = 'Drag ended';
    });
    
    canvas.addEventListener('mousemove', function(e) {
        if (isDragging) {
            console.log('Dragging');
            cameraOffset.x = e.clientX - dragStart.x;
            cameraOffset.y = e.clientY - dragStart.y;
            debugDiv.innerHTML = `Dragging: offset (${cameraOffset.x.toFixed(0)}, ${cameraOffset.y.toFixed(0)})`;
            applyTransform();
        }
    });
    
    canvas.addEventListener('wheel', function(e) {
        e.preventDefault();
        console.log('Wheel event detected');
        
        const zoomAmount = e.deltaY * -0.01;
        cameraZoom = Math.max(0.1, Math.min(5, cameraZoom + zoomAmount));
        
        debugDiv.innerHTML = `Zoom: ${cameraZoom.toFixed(1)}x`;
        applyTransform();
    });
    
    // Function to apply transforms to canvas
    function applyTransform() {
        // Get the original transform
        const originalTransform = window.getComputedStyle(canvas).transform;
        
        // Apply new transform
        canvas.style.transform = `translate(${cameraOffset.x}px, ${cameraOffset.y}px) scale(${cameraZoom})`;
        
        // Force redraw by triggering a resize event
        window.dispatchEvent(new Event('resize'));
    }
    
    // Make sure canvas can receive focus for events
    canvas.tabIndex = 0;
    canvas.style.outline = 'none';
    canvas.focus();
    
    // Add CSS to make sure the canvas can receive pointer events
    const style = document.createElement('style');
    style.textContent = `
        #simulationCanvas {
            cursor: grab;
            touch-action: none;
            position: relative;
        }
        #simulationCanvas:active {
            cursor: grabbing;
        }
    `;
    document.head.appendChild(style);
});
