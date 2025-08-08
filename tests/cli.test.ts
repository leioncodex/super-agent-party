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
  writeFileSync(path.join(temp, '__init__.py'),
    "from py.agent_tool import register_tool\n"+
    "def ping():\n    return 'pong'\n"+
    "register_tool('ping', ping, {'type':'object','properties':{},'required':[]})\n"
  );
  execSync('git add .', { cwd: temp });
  execSync('git commit -m init', { cwd: temp });
  execSync(`node agent.js add ${temp}`, { cwd: root, stdio: 'inherit' });
  const out = execSync("python - <<'PY'\nimport asyncio\nfrom py.agent_tool import call_tool\nprint(asyncio.run(call_tool('ping', {})))\nPY", { cwd: root });
  expect(out.toString().trim()).toBe('pong');
});
