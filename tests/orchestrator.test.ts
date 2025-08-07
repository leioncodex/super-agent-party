import { Orchestrator } from '../src/core/orchestrator';
import { promises as fs } from 'fs';
import path from 'path';

const logDir = path.join(__dirname, '..', 'src', 'logs');
const logFile = path.join(logDir, 'logs.json');

describe('Orchestrator', () => {
  beforeEach(async () => {
    try {
      await fs.unlink(logFile);
    } catch {}
  });

  it('executes agents sequentially and logs', async () => {
    const orch = new Orchestrator(logDir);
    const order: string[] = [];
    orch.enqueue('A', async () => { order.push('A'); return 1; });
    orch.enqueue('B', async () => { order.push('B'); return 2; });
    await orch.run('sequential');
    const logs = orch.getLogs();
    expect(order).toEqual(['A', 'B']);
    expect(logs.map(l => l.agent)).toEqual(['A', 'B']);
    const file = JSON.parse(await fs.readFile(logFile, 'utf-8'));
    expect(file.length).toBe(2);
  });

  it('executes agents in parallel and logs', async () => {
    const orch = new Orchestrator(logDir);
    orch.enqueue('A', async () => 1);
    orch.enqueue('B', async () => 2);
    await orch.run('parallel');
    const logs = orch.getLogs();
    expect(logs.length).toBe(2);
  });
});
