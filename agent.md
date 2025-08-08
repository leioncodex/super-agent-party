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

# Agent Task: Init Tauri + React

## Prompt 1: Tauri Backend Setup
- **Target**: `src-tauri/Cargo.toml`, `src-tauri/src/main.rs`
- Créer un backend Rust minimal pour Tauri :
  - `Cargo.toml` template avec dépendance `tauri` (feature `api-all`).
  - `main.rs` lançant l'application Tauri avec une fenêtre par défaut.

## Prompt 2: React Frontend
- **Target**: `src/`, `package.json`
- Initialiser un projet React (Vite recommandé) dans `src/`.
- Mettre à jour `package.json` :
  - scripts `dev`, `build`, `preview` fournis par Vite.
  - script `tauri` pour lancer Tauri (`"tauri": "tauri"`).
  - dépendance de développement `@tauri-apps/cli`.

## Prompt 3: Configuration Tauri
- **Target**: `tauri.conf.json`
- Configurer l'app pour utiliser le bundler React :
  - `build.distDir` pointant vers le dossier de sortie (`dist`).
  - `build.devPath` sur l'URL de développement (`http://localhost:5173`).
  - Autoriser toutes les API (`allowlist.all = true`).
  - Définir une fenêtre principale (titre, dimensions).

## Prompt 4: Vérification
- Exécuter `npm run tauri dev` pour vérifier que backend et frontend se lancent correctement.
