import React, { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import AgentCard, { Agent } from './AgentCard';

const AgentCreator: React.FC = () => {
  const [name, setName] = useState('');
  const [model, setModel] = useState('');
  const [agents, setAgents] = useState<Agent[]>([]);

  const fetchAgents = async () => {
    try {
      const list = await invoke<Agent[]>('list_agents');
      setAgents(list);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await invoke('create_agent', { name, model });
      setName('');
      setModel('');
      await fetchAgents();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          className="border p-2 rounded flex-1"
          placeholder="Agent name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="border p-2 rounded flex-1"
          placeholder="Model"
          value={model}
          onChange={(e) => setModel(e.target.value)}
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Create
        </button>
      </form>
      <div className="grid gap-4">
        {agents.map((agent) => (
          <AgentCard key={agent.id} agent={agent} />
        ))}
      </div>
    </div>
  );
};

export default AgentCreator;
