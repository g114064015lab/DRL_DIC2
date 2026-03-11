document.addEventListener('DOMContentLoaded', () => {
    const generateBtn = document.getElementById('generate-btn');
    const gridSizeInput = document.getElementById('grid-size');
    const gridSection = document.getElementById('grid-section');
    const gridContainer = document.getElementById('grid-container');
    const gridTitle = document.getElementById('grid-title');
    const instructionText = document.getElementById('instruction-text');
    const solveBtn = document.getElementById('solve-btn');
    
    // Result elements
    const resultsSection = document.getElementById('results-section');
    const valueGrid = document.getElementById('value-grid');
    const policyGrid = document.getElementById('policy-grid');
    
    // Status badges updates
    document.querySelector('.status-badge.start').innerHTML = '<i></i> Start: <span id="start-status">Not Set</span>';
    document.querySelector('.status-badge.end').innerHTML = '<i></i> End: <span id="end-status">Not Set</span>';
    document.querySelector('.status-badge.obstacle').innerHTML = '<i></i> Obstacles: <span id="obs-status">0 / X</span>';

    let currentN = 5;
    let maxObstacles = 0;
    
    // State: 0 = start, 1 = end, 2 = obstacles, 3 = done
    let selectionState = 0; 
    let startCellId = null;
    let endCellId = null;
    let obstacleCellIds = new Set();

    generateBtn.addEventListener('click', () => {
        let n = parseInt(gridSizeInput.value, 10);
        
        if (isNaN(n) || n < 5 || n > 9) {
            alert('Please enter a valid number between 5 and 9.');
            return;
        }

        initializeGrid(n);
    });

    function initializeGrid(n) {
        currentN = n;
        maxObstacles = n - 2;
        
        // Reset states
        selectionState = 0;
        startCellId = null;
        endCellId = null;
        obstacleCellIds.clear();
        
        // Hide solve elements when generating a new grid
        solveBtn.classList.add('hidden');
        resultsSection.classList.add('hidden');
        
        // Update texts
        gridTitle.textContent = `${n} x ${n} Square:`;
        instructionText.textContent = "1. Click on a cell to set up the start grid as green.";
        
        const sSpan = document.getElementById('start-status');
        const eSpan = document.getElementById('end-status');
        const oSpan = document.getElementById('obs-status');
        
        sSpan.textContent = "Not Set";
        eSpan.textContent = "Not Set";
        oSpan.textContent = `0 / ${maxObstacles}`;
        
        // Build Grid
        gridContainer.style.gridTemplateColumns = `repeat(${n}, 1fr)`;
        gridContainer.innerHTML = '';
        
        const totalCells = n * n;
        for (let i = 1; i <= totalCells; i++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.textContent = i;
            cell.dataset.id = i;
            cell.style.animation = `fadeIn 0.3s ease-out ${(i % n) * 0.05}s both`;
            cell.addEventListener('click', () => handleCellClick(cell, i, sSpan, eSpan, oSpan));
            gridContainer.appendChild(cell);
        }
        
        gridSection.classList.remove('hidden');
    }

    function handleCellClick(cell, id, sSpan, eSpan, oSpan) {
        if (cell.classList.contains('start') || cell.classList.contains('end') || cell.classList.contains('obstacle')) {
            return;
        }

        if (selectionState === 0) {
            cell.classList.add('start');
            startCellId = id;
            sSpan.textContent = `Cell ${id}`;
            selectionState = 1;
            instructionText.innerHTML = "2. Click on another cell to set up the <strong>end grid as red</strong>.";
            
        } else if (selectionState === 1) {
            cell.classList.add('end');
            endCellId = id;
            eSpan.textContent = `Cell ${id}`;
            selectionState = 2;
            instructionText.innerHTML = `3. Click on up to <strong>${maxObstacles} cells</strong> to set them as obstacles (gray).`;
            
            // It's possible to solve without any obstacles
            solveBtn.classList.remove('hidden');
            
        } else if (selectionState === 2) {
            if (obstacleCellIds.size < maxObstacles) {
                cell.classList.add('obstacle');
                obstacleCellIds.add(id);
                oSpan.textContent = `${obstacleCellIds.size} / ${maxObstacles}`;
                
                if (obstacleCellIds.size === maxObstacles) {
                    selectionState = 3;
                    instructionText.innerHTML = "<strong>Grid setup complete!</strong> Click 'Solve RL' to evaluate the policy.";
                }
            }
        }
    }
    
    // --- RL Solving Logic ---
    solveBtn.addEventListener('click', () => {
        if (!startCellId || !endCellId) {
            alert("Start and End cell must be set before solving.");
            return;
        }
        
        // Show loading state
        solveBtn.disabled = true;
        solveBtn.textContent = "Solving...";

        const payload = {
            n: currentN,
            start_id: startCellId,
            end_id: endCellId,
            obstacle_ids: Array.from(obstacleCellIds)
        };

        fetch('/solve', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert("Error: " + data.error);
                return;
            }
            renderResults(data.value_matrix, data.policy_matrix);
        })
        .catch(err => {
            console.error("Fetch error:", err);
            alert("An error occurred while communicating with the server.");
        })
        .finally(() => {
            solveBtn.disabled = false;
            solveBtn.textContent = "Solve RL";
        });
    });

    function renderResults(valueMatrix, policyMatrix) {
        // Prepare grids
        valueGrid.style.gridTemplateColumns = `repeat(${currentN}, 1fr)`;
        policyGrid.style.gridTemplateColumns = `repeat(${currentN}, 1fr)`;
        valueGrid.innerHTML = '';
        policyGrid.innerHTML = '';
        
        // Value Matrix
        for (let row of valueMatrix) {
            for (let val of row) {
                const cell = document.createElement('div');
                cell.classList.add('result-cell');
                if (val === null) {
                    cell.classList.add('obstacle');
                } else if (val === 0.0) {
                     // Empty display for end state or zero value? The user image shows values.
                     cell.textContent = val.toFixed(2);
                } else {
                    cell.textContent = val.toFixed(2);
                }
                valueGrid.appendChild(cell);
            }
        }
        
        // Policy Matrix
        for (let row of policyMatrix) {
            for (let action of row) {
                const cell = document.createElement('div');
                cell.classList.add('result-cell', 'arrow-cell');
                
                if (action === "OBS") {
                    cell.classList.add('obstacle');
                } else if (action === "END") {
                    // Do nothing for END cell visual in policy (leave blank or similar, image shows blank)
                } else {
                    cell.textContent = action;
                }
                policyGrid.appendChild(cell);
            }
        }
        
        resultsSection.classList.remove('hidden');
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
});
