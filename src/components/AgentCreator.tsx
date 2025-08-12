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

import { invoke } from '@tauri-apps/api/tauri';
import { useState, useEffect } from 'react';

export function AgentCreator() {
  const [agents, setAgents] = useState<any[]>([]);
  const [personas, setPersonas] = useState<any[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadAgents();
    loadPersonas();
  }, []);

  const loadAgents = async () => {
    const list = await invoke('list_agents');
    setAgents(list as any[]);
  };

  const loadPersonas = async () => {
    const list = (await invoke('list_personas')) as any[];
    const enriched = await Promise.all(
      list.map(async p => {
        const memory = await invoke('get_persona_memory', { id: p.id, query: '' });
        return { ...p, memory };
      })
    );
    setPersonas(enriched);
  };

  const createAgent = async () => {
    setIsCreating(true);
    const name = prompt("Nom de l'agent ?");
    if (!name) {
      setIsCreating(false);
      return;
    }

    const voice = prompt('Voix ?') || '';
    const style = prompt('Style ?') || '';
    const prompts = (prompt('Prompts système (séparés par \n)') || '')
      .split('\n')
      .filter(p => p.trim());
    const tools = (prompt('Outils (séparés par ,)') || '')
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    try {
      await invoke('create_agent', { name, persona: { voice, style, prompts, tools } });
      await loadAgents();
      await loadPersonas();
    } catch (e) {
      console.error("Erreur création agent", e);
    } finally {
      setIsCreating(false);
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
        {agents.map(agent => {
          const persona = personas.find(p => p.id === agent.name);
          return (
            <div key={agent.name} className="border p-4 rounded-lg">
              <h3 className="font-bold">{agent.name}</h3>
              <p className="text-sm text-gray-600">Rôle : {agent.role}</p>
              <p className="text-xs">Statut : {agent.status}</p>
              {persona && (
                <div className="mt-2 text-xs">
                  {persona.voice && <p>Voix : {persona.voice}</p>}
                  {persona.style && <p>Style : {persona.style}</p>}
                  {persona.prompts && persona.prompts.length > 0 && (
                    <p>Prompts : {persona.prompts.join(', ')}</p>
                  )}
                  {persona.tools && persona.tools.length > 0 && (
                    <p>Outils : {persona.tools.join(', ')}</p>
                  )}
                  {persona.memory && persona.memory.length > 0 && (
                    <p>Mémoire : {persona.memory.join(' | ')}</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
