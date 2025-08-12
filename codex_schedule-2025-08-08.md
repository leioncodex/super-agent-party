# Quantum Scheduler & Adaptive Scheduling

## Prompt 1: QuantumScheduler
- **Target**: `py/quantum_scheduler.py`
- Define class `QuantumScheduler` with classical heuristic fallback.
- Implement `anneal_schedule` via D-Wave/Neal `SimulatedAnnealingSampler`.
- Provide `schedule(tasks: List[Dict], mode: str)`.

## Prompt 2: Server `/schedule` Endpoint
- **Target**: `server.py`
- Instantiate `QuantumScheduler` and expose endpoint `/schedule` handling modes `classic`, `quantum`, `adaptive_energy`.
- Collect CPU/GPU metrics with `psutil` for `adaptive_energy`.
- Return scheduling plan.

## Prompt 3: Orchestrator
- **Target**: `src/core/orchestrator.ts`
- Request `/schedule`, pass desired mode.
- Adjust execution order using the returned plan.

## Prompt 4: Tests
- Run `pytest` for Python modules.
- Run `npm test` for TypeScript modules.
