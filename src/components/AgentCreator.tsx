import { invoke } from '@tauri-apps/api/tauri';
import { useState, useEffect } from 'react';

export function AgentCreator() {
  const [agents, setAgents] = useState<any[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    const list = await invoke('list_agents');
    setAgents(list as any[]);
  };

  const createAgent = async () => {
    setIsCreating(true);
    const name = prompt("Nom de l'agent ?");
    if (!name) {
      setIsCreating(false);
      return;
    }

    try {
      await invoke('create_agent', { name });
      await loadAgents();
    } catch (e) {
      console.error("Erreur création agent", e);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <h2 className="text-xl font-bold mb-3">Gestion des Agents</h2>
      
      <button
        onClick={createAgent}
        disabled={isCreating}
        className={`bg-blue-600 text-white px-4 py-2 rounded-lg ${
          isCreating ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {isCreating ? 'Création...' : '➕ Créer un agent'}
      </button>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {agents.map(agent => (
          <div key={agent.name} className="border p-4 rounded-lg">
            <h3 className="font-bold">{agent.name}</h3>
            <p className="text-sm text-gray-600">Rôle : {agent.role}</p>
            <p className="text-xs">Statut : {agent.status}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
