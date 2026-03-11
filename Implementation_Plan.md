# Goal Description

Enhance the Flask Grid Map application to include a Reinforcement Learning (RL) aspect: calculating and displaying the **Value Matrix** and **Policy Matrix**.
Once the user finishes setting up the grid (start, end, and obstacles), the application will generate random random policies (actions up, down, left, right), evaluate them to derive the value of each state $V(s)$, and display both matrices side by side.

## User Review Required

- This plan introduces a python backend script `rl_solver.py` to calculate the RL matrices cleanly without cluttering `app.py`.
- **Assumptions for MDP:**
  - States: Every non-obstacle cell is a state.
  - Actions: 4 directional movements (Up, Down, Left, Right).
  - Rewards: -1 per step, +0 at the goal state (absorbing). Obstacles act as walls.
  - Discount factor ($\gamma$): Defaults to `1.0`.
  - Is this MDP configuration acceptable for the assignment/use-case, or do you have different reward values?

## Proposed Changes

### Python API Expansion

#### [NEW] rl_solver.py
- Extract logic to a standalone module.
- Input: `n` (grid size), `start_index`, `end_index`, `obstacle_indices`.
- Output: A JSON payload containing the Value Matrix (floats) and Policy Matrix (list of arrows).
- Logic:
  - Generate a completely random policy for all non-terminal states.
  - Perform iterative policy evaluation.

#### [MODIFY] app.py
- Add a new `POST /solve` endpoint.
- Map the incoming JSON grid setup from the frontend to `rl_solver.py`.
- Return the computed matrices.

### Frontend Application

#### [MODIFY] templates/index.html
- Add a new "Solve RL" button that becomes visible once the grid is fully generated and configured.
- Add containers below the setup grid to render two new matrices side-by-side:
  - **Value Matrix**: Shows computed numbers.
  - **Policy Matrix**: Shows generated actions as Unicode arrows (↑, ↓, ←, →).

#### [MODIFY] static/style.css
- Style the results container to use CSS Grid/Flexbox for side-by-side matrices matching the user-uploaded reference image.
- Render the obstacles dark gray, end states appropriately, and the policy arrows centrally aligned inside the cells.

#### [MODIFY] static/script.js
- Add an event listener to the "Solve RL" button.
- Extract the configured start, end, and obstacles, and `fetch()` the `/solve` endpoint on the backend.
- Parse the resulting JSON and dynamically render the two new SVG/HTML grids in the result containers.

## Verification Plan

### Automated/Manual Verification
1. Restart the Flask application (`python app.py`).
2. Run a browser subagent:
   - Generate a 6x6 grid.
   - Set up start (e.g., cell 1), end (e.g., cell 36), and 4 obstacles (e.g. 10,11,12,13).
   - Verify the "Solve RL" button appears.
3. Click "Solve RL":
   - Wait for the API response.
   - Verify two new grids appear side-by-side (Value Matrix and Policy Matrix).
   - Ensure the policy matrix displays correct arrow directions.
   - Ensure the value matrix displays properly rounded floating numbers.
