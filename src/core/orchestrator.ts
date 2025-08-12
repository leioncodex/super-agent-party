import fs from 'fs';

import { promises as fs } from 'fs';
import path from 'path';

export type AgentTask = () => Promise<any>;

export interface LogEntry {
  agent: string;
  timestamp: number;
  result: any;
}

export class Orchestrator {
  private queue: { name: string; task: AgentTask }[] = [];
  private logs: LogEntry[] = [];
  private logPath: string;

  constructor(logDir = path.join(__dirname, '..', 'logs')) {
    this.logPath = path.join(logDir, 'logs.json');
    if (fs.existsSync(this.logPath)) {
      try {
        const data = fs.readFileSync(this.logPath, 'utf-8');
        this.logs = JSON.parse(data);
      } catch {
        this.logs = [];
      }
    }
  }

  enqueue(name: string, task: AgentTask) {
    this.queue.push({ name, task });
  }

  async run(mode: 'sequential' | 'parallel' = 'sequential') {
    if (mode === 'parallel') {
      await Promise.all(this.queue.map((q) => this.runTask(q)));
    } else {
      for (const q of this.queue) {
        await this.runTask(q);
      }
    }
  }

  private async runTask(entry: { name: string; task: AgentTask }) {
    const result = await entry.task();
    const log: LogEntry = { agent: entry.name, timestamp: Date.now(), result };
    this.logs.push(log);
    await fs.promises.mkdir(path.dirname(this.logPath), { recursive: true });
    await fs.promises.writeFile(this.logPath, JSON.stringify(this.logs, null, 2));
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }
}
