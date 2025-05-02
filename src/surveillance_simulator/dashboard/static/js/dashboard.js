document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('simulationCanvas');
    const ctx = canvas.getContext('2d');
    const sensorStats = document.getElementById('sensorStats');
    const detectionStats = document.getElementById('detectionStats');
    const speedValue = document.getElementById('speedValue');
    
    const initializeBtn = document.getElementById('initializeBtn');
    const numSensorsInput = document.getElementById('numSensors');
    const numObjectsInput = document.getElementById('numObjects');
    const simulationSpeedInput = document.getElementById('simulationSpeed');
    
    let simulationState = {
        sensors: [],
        detected_objects: [],
        timestamp: 0
    };
    
    // Add these variables at the top of your DOMContentLoaded function
    let cameraOffset = { x: 0, y: 0 };
    let cameraZoom = 1;
    let isDragging = false;
    let dragStart = { x: 0, y: 0 };
    let lastZoom = cameraZoom;
    
    // Add a debug section to the HTML
    const debugInfoElement = document.createElement('div');
    debugInfoElement.id = 'debugInfo';
    debugInfoElement.style.position = 'fixed';
    debugInfoElement.style.bottom = '10px';
    debugInfoElement.style.left = '10px';
    debugInfoElement.style.backgroundColor = 'rgba(0,0,0,0.7)';
    debugInfoElement.style.color = 'white';
    debugInfoElement.style.padding = '10px';
    debugInfoElement.style.borderRadius = '5px';
    document.body.appendChild(debugInfoElement);
    
    // Update speed display when slider changes
    simulationSpeedInput.addEventListener('input', function() {
        speedValue.textContent = `${parseFloat(this.value).toFixed(1)}x`;
    });
    
    // Connect to WebSocket
    function connectWebSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
        
        ws.onopen = function() {
            console.log('WebSocket connection established');
            // Create a debug panel
            const debugPanel = document.createElement('div');
            debugPanel.id = 'debugPanel';
            debugPanel.style.position = 'fixed';
            debugPanel.style.bottom = '10px';
            debugPanel.style.right = '10px';
            debugPanel.style.backgroundColor = 'rgba(0,0,0,0.7)';
            debugPanel.style.color = 'white';
            debugPanel.style.padding = '10px';
            debugPanel.style.fontFamily = 'monospace';
            debugPanel.style.zIndex = 1000;
            document.body.appendChild(debugPanel);
            
            // Add a heartbeat ping to keep connection alive
            setInterval(() => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send('ping');
                }
            }, 30000);
            
            // Add a simulation debug button
            const debugButton = document.createElement('button');
            debugButton.textContent = 'Debug Simulation';
            debugButton.style.position = 'fixed';
            debugButton.style.top = '10px';
            debugButton.style.right = '10px';
            document.body.appendChild(debugButton);
            
            debugButton.addEventListener('click', () => {
                fetch('/simulation/debug')
                    .then(response => response.json())
                    .then(data => {
                        debugPanel.innerHTML = `
                            <h3>Simulation Debug</h3>
                            <pre>${JSON.stringify(data, null, 2)}</pre>
                        `;
                    })
                    .catch(err => {
                        debugPanel.innerHTML = `<h3>Error fetching debug info</h3><pre>${err}</pre>`;
                    });
            });
        };
        
        let lastUpdateTime = Date.now();
        
        ws.onmessage = function(event) {
            const now = Date.now();
            const timeSinceLastUpdate = now - lastUpdateTime;
            lastUpdateTime = now;
            
            const data = JSON.parse(event.data);
            simulationState = data;
            renderSimulation();
            updateStats();
            
            // Update debug panel with timing information
            const debugPanel = document.getElementById('debugPanel');
            if (debugPanel) {
                debugPanel.innerHTML = `
                    <div>Last Update: ${new Date().toLocaleTimeString()}</div>
                    <div>Update Interval: ${timeSinceLastUpdate}ms</div>
                    <div>Sensors: ${data.sensors.length}</div>
                    <div>Detected Objects: ${data.detected_objects.length}</div>
                `;
            }
        };
        
        ws.onclose = function(event) {
            console.log('WebSocket connection closed:', event.code, event.reason);
            // Show reconnection message
            const debugPanel = document.getElementById('debugPanel');
            if (debugPanel) {
                debugPanel.innerHTML = `
                    <div style="color: red">WebSocket Disconnected</div>
                    <div>Reconnecting in 2 seconds...</div>
                `;
            }
            // Attempt to reconnect after a delay
            setTimeout(connectWebSocket, 2000);
        };
        
        ws.onerror = function(error) {
            console.error('WebSocket error:', error);
            const debugPanel = document.getElementById('debugPanel');
            if (debugPanel) {
                debugPanel.innerHTML = `
                    <div style="color: red">WebSocket Error</div>
                    <div>Check console for details</div>
                `;
            }
        };
        
        return ws;
    }
    
    let ws = connectWebSocket();
    
    // Add a debug initialization check
    initializeBtn.addEventListener('click', function() {
        console.log('Initialize button clicked');
        const debugPanel = document.getElementById('debugPanel');
        if (debugPanel) {
            debugPanel.innerHTML = '<div>Initializing simulation...</div>';
        }
        
        fetch('/simulation/initialize', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                num_sensors: parseInt(numSensorsInput.value),
                num_objects: parseInt(numObjectsInput.value),
                simulation_speed: parseFloat(simulationSpeedInput.value)
            })
        })
        .then(response => response.json())
        .then(data => {
            console.log('Simulation initialized:', data);
            if (debugPanel) {
                debugPanel.innerHTML = '<div style="color:green">Simulation initialized successfully</div>';
            }
            
            // Verify simulation state after a short delay
            setTimeout(() => {
                fetch('/simulation/debug')
                    .then(response => response.json())
                    .then(debugData => {
                        if (debugPanel) {
                            debugPanel.innerHTML = `
                                <h3>Initialization Verification</h3>
                                <pre>${JSON.stringify(debugData, null, 2)}</pre>
                            `;
                        }
                    });
            }, 1000);
        })
        .catch(error => {
            console.error('Error initializing simulation:', error);
            if (debugPanel) {
                debugPanel.innerHTML = `<div style="color:red">Error initializing: ${error}</div>`;
            }
        });
    });
    
    // Add mouse event handlers for canvas
    canvas.addEventListener('mousedown', function(e) {
        isDragging = true;
        dragStart.x = e.clientX - cameraOffset.x;
        dragStart.y = e.clientY - cameraOffset.y;
    });

    canvas.addEventListener('mouseup', function() {
        isDragging = false;
    });

    canvas.addEventListener('mouseleave', function() {
        isDragging = false;
    });

    canvas.addEventListener('mousemove', function(e) {
        if (isDragging) {
            cameraOffset.x = e.clientX - dragStart.x;
            cameraOffset.y = e.clientY - dragStart.y;
            renderSimulation();
        }
    });

    canvas.addEventListener('wheel', function(e) {
        e.preventDefault();
        
        // Get mouse position relative to canvas
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Calculate zoom factor
        const zoomAmount = e.deltaY * -0.01;
        const newZoom = Math.max(0.1, Math.min(5, cameraZoom + zoomAmount));
        
        // Calculate zoom center point
        const zoomRatio = newZoom / cameraZoom;
        
        // Adjust camera offset to zoom toward mouse position
        cameraOffset.x = mouseX - (mouseX - cameraOffset.x) * zoomRatio;
        cameraOffset.y = mouseY - (mouseY - cameraOffset.y) * zoomRatio;
        
        cameraZoom = newZoom;
        
        renderSimulation();
    });
    
    // Add this function near the beginning of your file (after variable declarations)
    function applyCanvasTransformations() {
        if (window.simulationTransform) {
            ctx.save();
            ctx.translate(canvas.width/2, canvas.height/2);
            ctx.scale(window.simulationTransform.zoom, window.simulationTransform.zoom);
            ctx.translate(-canvas.width/2 + window.simulationTransform.offsetX, -canvas.height/2 + window.simulationTransform.offsetY);
        }
    }

    function restoreCanvasTransformations() {
        if (window.simulationTransform) {
            ctx.restore();
        }
    }

    // Modify your renderSimulation function to use these
    function renderSimulation() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        applyCanvasTransformations();
        
        // Draw grid
        drawGrid();
        
        // Draw sensors
        simulationState.sensors.forEach(sensor => {
            const x = sensor.position.x;
            const y = sensor.position.y;
            
            // Draw sensor range (transparent circle)
            ctx.beginPath();
            ctx.arc(x, y, sensor.range, 0, 2 * Math.PI);
            ctx.fillStyle = `rgba(200, 200, 200, 0.1)`;
            ctx.fill();
            ctx.strokeStyle = 'rgba(100, 100, 100, 0.3)';
            ctx.stroke();
            
            // Draw sensor
            ctx.beginPath();
            ctx.arc(x, y, 10, 0, 2 * Math.PI);
            
            switch(sensor.type) {
                case 'drone':
                    ctx.fillStyle = 'blue';
                    break;
                case 'tower':
                    ctx.fillStyle = 'green';
                    break;
                case 'border_unit':
                    ctx.fillStyle = 'purple';
                    break;
            }
            
            ctx.fill();
            
            // Draw direction indicator for moving sensors
            if (sensor.speed > 0) {
                const dirX = x + Math.cos(sensor.heading) * 15;
                const dirY = y + Math.sin(sensor.heading) * 15;
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(dirX, dirY);
                ctx.strokeStyle = 'black';
                ctx.stroke();
            }
            
            // Draw sensor ID
            ctx.font = '10px Arial';
            ctx.fillStyle = 'black';
            ctx.fillText(sensor.id, x - 15, y - 15);
        });
        
        // Draw detected objects
        simulationState.detected_objects.forEach(obj => {
            const x = obj.position.x;
            const y = obj.position.y;
            
            ctx.beginPath();
            ctx.arc(x, y, 8, 0, 2 * Math.PI);
            
            switch(obj.type) {
                case 'person':
                    ctx.fillStyle = 'red';
                    break;
                case 'drone':
                    ctx.fillStyle = 'orange';
                    break;
                case 'vehicle':
                    ctx.fillStyle = 'brown';
                    break;
            }
            
            ctx.fill();
            
            // Draw confidence indicator
            ctx.font = '10px Arial';
            ctx.fillStyle = 'black';
            ctx.fillText(`${Math.round(obj.confidence * 100)}%`, x + 10, y - 10);
        });
        
        // Add this line to fetch all objects
        fetchAllObjects();
        
        restoreCanvasTransformations();
    }
    
    // Draw grid on canvas
    function drawGrid() {
        const gridSize = 100;
        const mapWidth = 1000;
        const mapHeight = 1000;
        
        // Calculate visible area
        const visibleX = -cameraOffset.x / cameraZoom + canvas.width / 2;
        const visibleY = -cameraOffset.y / cameraZoom + canvas.height / 2;
        const visibleWidth = canvas.width / cameraZoom;
        const visibleHeight = canvas.height / cameraZoom;
        
        // Adjust grid line limits based on visible area
        const startX = Math.floor((visibleX - visibleWidth / 2) / gridSize) * gridSize;
        const endX = Math.ceil((visibleX + visibleWidth / 2) / gridSize) * gridSize;
        const startY = Math.floor((visibleY - visibleHeight / 2) / gridSize) * gridSize;
        const endY = Math.ceil((visibleY + visibleHeight / 2) / gridSize) * gridSize;
        
        ctx.strokeStyle = 'rgba(200, 200, 200, 0.3)';
        ctx.lineWidth = 1;
        
        // Draw vertical lines
        for (let x = startX; x <= endX; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, mapHeight);
            ctx.stroke();
        }
        
        // Draw horizontal lines
        for (let y = startY; y <= endY; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(mapWidth, y);
            ctx.stroke();
        }
    }
    
    // Update statistics panel
    function updateStats() {
        // Sensor stats
        sensorStats.innerHTML = '';
        simulationState.sensors.forEach(sensor => {
            const sensorElement = document.createElement('div');
            sensorElement.className = 'sensor-stat';
            
            let borderColor;
            switch(sensor.type) {
                case 'drone':
                    borderColor = 'blue';
                    break;
                case 'tower':
                    borderColor = 'green';
                    break;
                case 'border_unit':
                    borderColor = 'purple';
                    break;
            }
            
            sensorElement.style.borderLeftColor = borderColor;
            
            sensorElement.innerHTML = `
                <div><strong>${sensor.id} (${sensor.type})</strong></div>
                <div>Battery: ${sensor.battery_level.toFixed(1)}%</div>
                <div>Signal: ${sensor.signal_quality.toFixed(1)}%</div>
                <div>Load: ${sensor.system_load.toFixed(1)}%</div>
                <div>Position: (${sensor.position.x.toFixed(0)}, ${sensor.position.y.toFixed(0)})</div>
            `;
            
            sensorStats.appendChild(sensorElement);
        });
        
        // Detection stats
        const detectionCount = simulationState.detected_objects.length;
        
        // Count detections by type
        const detectionsByType = {};
        simulationState.detected_objects.forEach(obj => {
            detectionsByType[obj.type] = (detectionsByType[obj.type] || 0) + 1;
        });
        
        let detectionHtml = `<h3>Total Detections: ${detectionCount}</h3>`;
        
        for (const [type, count] of Object.entries(detectionsByType)) {
            detectionHtml += `<div>${type}: ${count}</div>`;
        }
        
        detectionStats.innerHTML = detectionHtml;
    }
    
    // Update the debug info when objects are fetched
    function fetchAllObjects() {
        fetch('/simulation/all-objects')
            .then(response => response.json())
            .then(data => {
                // Draw all objects in a different color
                drawAllObjects(data.objects);
                
                // Update debug info
                if (data.objects && data.objects.length > 0) {
                    debugInfoElement.innerHTML = `
                        <strong>Objects:</strong> ${data.objects.length}<br>
                        <strong>Sample Positions:</strong><br>
                        ${data.objects.slice(0, 3).map(obj => 
                            `${obj.id}: (${Math.round(obj.position.x)}, ${Math.round(obj.position.y)})`
                        ).join('<br>')}
                    `;
                }
            })
            .catch(error => console.error('Error fetching all objects:', error));
    }
    
    // Add this function to draw all objects
    function drawAllObjects(objects) {
        objects.forEach(obj => {
            const x = obj.position.x;
            const y = obj.position.y;
            
            ctx.beginPath();
            ctx.arc(x, y, 6, 0, 2 * Math.PI);
            ctx.fillStyle = 'rgba(100, 100, 100, 0.5)'; // Gray for undetected objects
            ctx.fill();
        });
    }
    
    // Add a status indicator to show zoom level and pan position
    const statusIndicator = document.createElement('div');
    statusIndicator.style.position = 'fixed';
    statusIndicator.style.bottom = '10px';
    statusIndicator.style.left = '10px';
    statusIndicator.style.background = 'rgba(0,0,0,0.5)';
    statusIndicator.style.color = 'white';
    statusIndicator.style.padding = '5px';
    statusIndicator.style.borderRadius = '3px';
    statusIndicator.style.fontFamily = 'monospace';
    statusIndicator.style.fontSize = '12px';
    document.body.appendChild(statusIndicator);

    // Update status indicator periodically
    setInterval(() => {
        statusIndicator.textContent = `Zoom: ${cameraZoom.toFixed(1)}x | Pan: (${Math.round(cameraOffset.x)}, ${Math.round(cameraOffset.y)})`;
    }, 100);
    
    // Initial grid drawing
    drawGrid();

    // Make the function globally available
    window.renderSimulation = renderSimulation;
});