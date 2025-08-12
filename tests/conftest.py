import sys
import types
import importlib.util
from pathlib import Path

root = Path(__file__).resolve().parents[1]
py_dir = root / "py"

# Create a lightweight 'py' package pointing to our local modules
package = types.ModuleType("py")
package.__path__ = [str(py_dir)]
sys.modules.setdefault("py", package)

# Pre-load tool_registry so imports succeed
spec = importlib.util.spec_from_file_location("py.tool_registry", py_dir / "tool_registry.py")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
sys.modules["py.tool_registry"] = module
