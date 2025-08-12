import { invoke } from '@tauri-apps/api/tauri';

export interface Agent {
  id: string;
  name: string;
}

export async function listAgents(): Promise<Agent[]> {
  return await invoke<Agent[]>('list_agents');
}

export async function createAgent(name: string): Promise<Agent> {
  return await invoke<Agent>('create_agent', { name });
}

export async function deleteAgent(id: string): Promise<void> {
  await invoke('delete_agent', { id });
}
