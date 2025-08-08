# Agent Task: Quantum Scheduler & Adaptive Scheduler Endpoint

## Prompt 1: Implement QuantumScheduler
- **Target**: `py/quantum_scheduler.py`
- Create class `QuantumScheduler` with a classical heuristic fallback.
- Add `anneal_schedule` leveraging D-Wave or Neal `SimulatedAnnealingSampler`.
- Expose `schedule(tasks: List[Dict], mode: str)` selecting classic or quantum processing.

## Prompt 2: Server `/schedule` Endpoint
- **Target**: `server.py`
- Import and instantiate `QuantumScheduler`.
- Provide `/schedule` endpoint supporting modes `classic`, `quantum`, and `adaptive_energy`.
- For `adaptive_energy`, gather CPU/GPU stats via `psutil` and forward them to the scheduler.
- Return the resulting plan in JSON.

## Prompt 3: Orchestrator Integration
- **Target**: `src/core/orchestrator.ts`
- Call the `/schedule` endpoint.
- Reorder agent execution according to the received plan and selected mode.

## Prompt 4: Tests
- Execute `pytest` for Python modules.
- Execute `npm test` for TypeScript modules.
