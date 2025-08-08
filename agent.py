import argparse
import subprocess
from pathlib import Path
from py.tool_registry import load_plugins

def add(repo_url: str, plugins_dir: str = "plugins") -> None:
    """Clone a plugin repository and activate its tools."""
    plugins_path = Path(plugins_dir)
    plugins_path.mkdir(exist_ok=True)
    dest = plugins_path / Path(repo_url).name
    subprocess.run([
        "git",
        "clone",
        repo_url,
        str(dest)
    ], check=True)
    load_plugins(str(plugins_path))

def main() -> None:
    parser = argparse.ArgumentParser(prog="agent")
    sub = parser.add_subparsers(dest="command")
    add_p = sub.add_parser("add")
    add_p.add_argument("repo_url")
    args = parser.parse_args()
    if args.command == "add":
        add(args.repo_url)
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
