# Agent Instruction: ComfyUI Media Endpoints

## Task
Implement FastAPI endpoints `/comfyui/image`, `/comfyui/video`, and `/comfyui/audio` to trigger dedicated ComfyUI workflows. Aggregate generated files and metadata into a single JSON payload using `asyncio`.

## Steps
1. **`py/comfyui_tool.py`**
   - Add async helper `run_workflow(workflow: str, text: str | None, image: str | None, extra_inputs: dict | None)` wrapping existing `comfyui_tool_call`.
   - Normalize return structure: list of file paths and associated metadata.
   - Ensure helper uses `asyncio` primitives and returns `{"files": [...], "meta": {...}}`.

2. **`server.py`**
   - Create POST endpoints `/comfyui/image`, `/comfyui/video`, `/comfyui/audio`.
   - Each endpoint accepts text/image inputs (as needed) and calls `run_workflow` with matching workflow names (`comfyui_image`, `comfyui_video`, `comfyui_audio`).
   - Use `asyncio.gather` when multiple outputs (files + metadata) are produced before responding.

3. **Documentation**
   - Update `doc/tools.md` with a new subsection **ComfyUI** detailing:
     - Required settings (`comfyuiServers`, workflow files).
     - Available endpoints and their expected inputs.
     - Example CURL usage.

4. **Testing**
   - Add or update tests under `tests/` verifying:
     - Endpoints return aggregated payload structure.
     - Mocked workflows handle image/video/audio generation.
   - Run `pytest` before committing.

## Definition of Done
- Endpoints available and documented.
- Tests passing.
- Commit message: `feat: add ComfyUI media endpoints`.
