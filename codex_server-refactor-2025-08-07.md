# Server argparse refactor - 2025-08-07
- move CLI parsing into main guard
- expose create_app(host, port) returning FastAPI instance
- use create_app in uvicorn.run
