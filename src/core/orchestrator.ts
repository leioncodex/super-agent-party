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
}
