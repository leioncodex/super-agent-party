import React, { useEffect, useState, FormEvent } from 'react';
import { createAgent, deleteAgent, listAgents, Agent } from '../api/agents';

export default function AgentDashboard() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [name, setName] = useState('');

  useEffect(() => {
    listAgents().then(setAgents);
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const agent = await createAgent(name.trim());
    setAgents([...agents, agent]);
    setName('');
  }

  async function handleDelete(id: string) {
    await deleteAgent(id);
    setAgents(agents.filter(a => a.id !== id));
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Agents</h1>
      <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
        <label htmlFor="agent-name" className="sr-only">Agent Name</label>
        <input
          id="agent-name"
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          className="border p-2 flex-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="New agent name"
        />
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 hover:bg-blue-600"
        >
          Create
        </button>
      </form>
      <ul className="space-y-2">
        {agents.map(agent => (
          <li key={agent.id} className="flex items-center justify-between border p-2 rounded">
            <span>{agent.name}</span>
            <button
              onClick={() => handleDelete(agent.id)}
              className="bg-red-500 text-white px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-red-400 hover:bg-red-600"
              aria-label={`Delete ${agent.name}`}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
