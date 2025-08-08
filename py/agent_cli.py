import argparse
import os
import subprocess
from pathlib import Path

from .tool_registry import load_plugins

BASE_DIR = Path(__file__).resolve().parent.parent
PLUGINS_DIR = BASE_DIR / "plugins"


def add_repo(repo_url: str) -> None:
    """Clone a repository into the plugins directory and reload plugins."""
    PLUGINS_DIR.mkdir(parents=True, exist_ok=True)
    repo_name = repo_url.rstrip("/").split("/")[-1]
    if repo_name.endswith(".git"):
        repo_name = repo_name[:-4]
    dest = PLUGINS_DIR / repo_name
    if dest.exists():
        raise RuntimeError(f"Plugin {repo_name} already exists")
    subprocess.check_call(["git", "clone", repo_url, str(dest)])
    load_plugins(str(PLUGINS_DIR))


def main() -> None:
    parser = argparse.ArgumentParser(prog="agent")
    sub = parser.add_subparsers(dest="command")
    add = sub.add_parser("add", help="Add a plugin from a git repository")
    add.add_argument("repo_url")
    args = parser.parse_args()
    if args.command == "add":
        add_repo(args.repo_url)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
