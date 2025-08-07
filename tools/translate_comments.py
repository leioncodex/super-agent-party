import re
from pathlib import Path
from typing import Iterable

try:
    from googletrans import Translator
except ImportError:  # pragma: no cover
    raise SystemExit("googletrans module is required. Install with 'pip install googletrans==4.0.0rc1'")

# Directories and files to scan
TARGETS: Iterable[Path] = [
    Path('server.py'),
    Path('src'),
    Path('src-tauri'),
    Path('tests'),
]

# File extensions considered source code
EXTENSIONS = {'.py', '.js', '.jsx', '.ts', '.tsx', '.rs', '.c', '.cpp', '.h'}

# Keywords requiring manual validation; comments containing these are skipped
SENSITIVE_KEYWORDS = {'TODO', 'FIXME'}

translator = Translator()

def should_skip(text: str) -> bool:
    return any(keyword in text for keyword in SENSITIVE_KEYWORDS)

def translate_text(text: str) -> str:
    return translator.translate(text, dest='fr').text

def translate_block_comment(match: re.Match) -> str:
    content = match.group(1)
    if should_skip(content):
        return match.group(0)
    translated = translate_text(content)
    return f"/*{translated}*/"

def translate_line_comment(prefix: str, comment: str) -> str:
    if should_skip(comment):
        return f"{prefix}{comment}"
    translated = translate_text(comment.strip())
    return f"{prefix}{translated}"

def process_file(path: Path) -> None:
    text = path.read_text(encoding='utf-8')

    # Block comments /* */
    text = re.sub(r'/\*([\s\S]*?)\*/', translate_block_comment, text)

    # Line comments starting with #
    text = re.sub(
        r'(^\s*#)(.*)$',
        lambda m: translate_line_comment(m.group(1), m.group(2)),
        text,
        flags=re.MULTILINE,
    )

    # Line comments starting with //
    text = re.sub(
        r'(^\s*//)(.*)$',
        lambda m: translate_line_comment(m.group(1), m.group(2)),
        text,
        flags=re.MULTILINE,
    )

    path.write_text(text, encoding='utf-8')
    print(f"Translated comments in {path}")

def gather_files(paths: Iterable[Path]) -> Iterable[Path]:
    for p in paths:
        if p.is_file() and p.suffix in EXTENSIONS:
            yield p
        elif p.is_dir():
            for file in p.rglob('*'):
                if file.suffix in EXTENSIONS:
                    yield file

def main() -> None:
    files = list(gather_files(TARGETS))
    for file in files:
        process_file(file)

if __name__ == '__main__':
    main()
