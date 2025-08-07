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
