import argparse
import uvicorn

from py.get_setting import configure_host_port
from . import app


def main() -> None:
    parser = argparse.ArgumentParser(description="Run the ASGI application server.")
    parser.add_argument("--host", default="127.0.0.1", help="Host for the ASGI server, default is 127.0.0.1")
    parser.add_argument("--port", type=int, default=3456, help="Port for the ASGI server, default is 3456")
    args = parser.parse_args()
    configure_host_port(args.host, args.port)
    uvicorn.run(app, host=args.host, port=args.port)


if __name__ == "__main__":
    main()
