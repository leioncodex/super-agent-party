import { save, search } from "../vector-store";
import { ollamaGenerate } from "../ollama";

interface OrchestratorState {
  currentGoal: string | null;
  activeAgents: string[];
  memory: Record<string, string[]>;
}

const STORAGE_KEY = "orchestrator-memory";

function loadState(): OrchestratorState {
  if (typeof localStorage !== "undefined") {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        return JSON.parse(raw) as OrchestratorState;
      } catch {
        /* ignore corrupted data */
      }
    }
  }
  return { currentGoal: null, activeAgents: [], memory: {} };
}

function saveState(state: OrchestratorState): void {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
}

const state: OrchestratorState = loadState();

export async function analyzeIntent(input: string): Promise<string> {
  const prompt = `Analyse l'intention suivante et résume-la:\n${input}`;
  return ollamaGenerate(prompt);
}

export function setGoal(goal: string): void {
  state.currentGoal = goal;
  saveState(state);
}

export async function getRelevantContext(query: string): Promise<unknown> {
  if (typeof search === "function") {
    return search(query);
  }
  return [];
}

export async function runTask(agent: string, task: string): Promise<string> {
  if (!state.activeAgents.includes(agent)) {
    state.activeAgents.push(agent);
  }

  const context = await getRelevantContext(task);
  const prompt = `Goal: ${state.currentGoal}\nTask: ${task}\nContext: ${JSON.stringify(context)}`;
  const result = await ollamaGenerate(prompt);

  state.memory[agent] = state.memory[agent] || [];
  state.memory[agent].push(result);
  saveState(state);

  if (typeof save === "function") {
    await save({ agent, task, result });
  }

  return result;
}

export async function autoSuggestNextStep(history: string): Promise<string> {
  const prompt = `Current goal: ${state.currentGoal}\nHistory: ${history}\nSuggest next step.`;
  return ollamaGenerate(prompt);
import { ollamaGenerate } from '../llm/ollama';
import { queryVectorStore, upsertVector } from '../vector-store';

interface MemoryEntry {
  timestamp: number;
  content: string;
}

export class Orchestrator {
  private currentGoal: string | null = null;
  private activeAgents: Set<string> = new Set();
  private memory: MemoryEntry[] = [];
  private db?: IDBDatabase;
  private readonly storageKey = 'orchestratorMemory';

  constructor() {
    this.initStorage();
  }

  private async initStorage() {
    if (typeof indexedDB !== 'undefined') {
      this.db = await this.openDB();
      this.memory = await this.loadFromDB();
    } else if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) {
        try {
          this.memory = JSON.parse(raw);
        } catch {
          this.memory = [];
        }
      }
    }
  }

  private openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('orchestrator', 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('memory')) {
          db.createObjectStore('memory', { keyPath: 'timestamp' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private loadFromDB(): Promise<MemoryEntry[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) return resolve([]);
      const tx = this.db.transaction('memory', 'readonly');
      const store = tx.objectStore('memory');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result as MemoryEntry[]);
      request.onerror = () => reject(request.error);
    });
  }

  private saveMemory(entry: MemoryEntry) {
    this.memory.push(entry);
    if (this.db) {
      const tx = this.db.transaction('memory', 'readwrite');
      tx.objectStore('memory').put(entry);
    } else if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.storageKey, JSON.stringify(this.memory));
    }
  }

  async analyzeIntent(prompt: string): Promise<string> {
    const intent = await ollamaGenerate({ prompt, mode: 'intent' });
    this.saveMemory({ timestamp: Date.now(), content: `Intent: ${intent}` });
    return intent;
  }

  setGoal(goal: string) {
    this.currentGoal = goal;
    this.saveMemory({ timestamp: Date.now(), content: `Goal: ${goal}` });
  }

  getGoal() {
    return this.currentGoal;
  }

  async getRelevantContext(query: string): Promise<string[]> {
    return queryVectorStore(query);
  }

  async runTask(task: string): Promise<string> {
    const context = await this.getRelevantContext(task);
    const prompt = `${task}\nContext:\n${context.join('\n')}`;
    const result = await ollamaGenerate({ prompt });
    this.saveMemory({
      timestamp: Date.now(),
      content: `Task: ${task} Result: ${result}`
    });
    await upsertVector(task, result);
    return result;
  }

  async autoSuggestNextStep(): Promise<string> {
    const history = this.memory.map(m => m.content).join('\n');
    const prompt = `Goal: ${this.currentGoal}\nHistory:\n${history}\nNext:`;
    const suggestion = await ollamaGenerate({ prompt });
    this.saveMemory({
      timestamp: Date.now(),
      content: `Suggestion: ${suggestion}`
    });
    return suggestion;
  }

  addAgent(agentId: string) {
    this.activeAgents.add(agentId);
  }

  removeAgent(agentId: string) {
    this.activeAgents.delete(agentId);
  }

  listAgents() {
    return Array.from(this.activeAgents);
  }
}

export default Orchestrator;

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
