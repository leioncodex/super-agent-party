import { mkdtempSync, writeFileSync, existsSync, unlinkSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import { execSync } from 'child_process';

const root = path.resolve(__dirname, '..');
const plugDir = path.resolve(root, 'src/plugins');
for (const f of ['plugin.js', 'plugin.mjs']) {
  const p = path.join(plugDir, f);
  if (existsSync(p)) unlinkSync(p);
}

test('agent add installs plugin', () => {
  const temp = mkdtempSync(path.join(tmpdir(), 'plug-'));
  execSync('git init', { cwd: temp });
  writeFileSync(
    path.join(temp, '__init__.py'),
    `def setup(register):
    schema = {"type": "object", "properties":{}, "required":[]}
    def ping():
        return 'pong'
    register('ping', 'ping back', schema, ping)
`);
  execSync('git add .', { cwd: temp });
  execSync('git commit -m init', { cwd: temp });
  execSync(`node agent.js add ${temp}`, { cwd: root, stdio: 'inherit' });
  const out = execSync("python - <<'PY'\nfrom py.tool_registry import call_tool\nprint(call_tool('ping', {}))\nPY", { cwd: root });
  expect(out.toString().trim()).toBe('pong');
});
