import { generateResponse } from '../api/ollama-api';

export class Orchestrator {
  private currentGoal: string | null = null;
  private activeAgents: string[] = [];
  private memory: { [key: string]: any } = {};

  async setGoal(goal: string) {
    this.currentGoal = goal;
    this.memory.lastGoal = goal;
    localStorage.setItem('orchestrator-memory', JSON.stringify(this.memory));
  }

  async runTask(task: string, agentNames: string[]): Promise<string> {
    this.activeAgents = agentNames;
    
    const prompt = `
      TÂCHE : ${task}
      
      AGIS COMME UN EXPERT. RÉPONDS EN FRANÇAIS.
    `;
    
    return await generateResponse(prompt, 'llama3');
  }
}
