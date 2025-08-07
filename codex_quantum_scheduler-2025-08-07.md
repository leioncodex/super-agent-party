# Quantum Scheduler Integration

## Prompt 1: Create `py/quantum_scheduler.py`
- Define class `QuantumScheduler` handling task scheduling.
- Implement a classical heuristic (e.g., greedy priority or simulated annealing stub) as fallback.
- Integrate a function `anneal_schedule` using D-Wave API (`dwave.system` or `neal.SimulatedAnnealingSampler`) with placeholder configuration.
- Expose method `schedule(tasks: List[Dict], mode: str)` that chooses heuristic or quantum annealing.

## Prompt 2: Integrate with `server.py`
- Import `QuantumScheduler` and instantiate globally.
- Add FastAPI endpoint `/schedule` accepting task list and mode (`classic`, `quantum`, `adaptive_energy`).
- For `adaptive_energy`, collect CPU/GPU metrics (use `psutil` or similar) and pass load data to scheduler.
- Return scheduling plan as JSON.

## Prompt 3: Update `src/core/orchestrator.ts`
- Add interface to call `/schedule` endpoint with selected mode.
- Implement "énergie adaptative" mode: query node load (CPU/GPU) and request resource reallocation from server.
- Provide hooks to adjust agent execution order based on returned plan.

## Prompt 4: Testing
- Run `pytest` for Python components.
- Run `npm test` for TypeScript/JS components.
