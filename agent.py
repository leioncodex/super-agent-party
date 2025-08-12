import argparse
import logging
import subprocess
from pathlib import Path
from py.tool_registry import load_plugins

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def add(repo_url: str, plugins_dir: str = "plugins") -> None:
    """Clone a plugin repository and activate its tools."""
    plugins_path = Path(plugins_dir)
    plugins_path.mkdir(exist_ok=True)
    dest = plugins_path / Path(repo_url).name
    if dest.exists():
        logger.info("Repository %s exists, attempting to update", dest)
        cmd = ["git", "-C", str(dest), "pull"]
    else:
        logger.info("Cloning %s into %s", repo_url, dest)
        cmd = ["git", "clone", repo_url, str(dest)]
    try:
        result = subprocess.run(cmd, check=True, capture_output=True, text=True)
        logger.debug("%s", result.stdout.strip())
    except subprocess.CalledProcessError as e:
        logger.error("%s", e.stderr.strip())
        raise RuntimeError(f"git command failed: {e.stderr.strip()}") from e
    load_plugins(str(plugins_path))
    logger.info("Plugins loaded from %s", plugins_path)

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
