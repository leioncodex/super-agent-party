import React, { useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';

export interface Agent {
  id: string;
  name: string;
  model: string;
  status: 'pending' | 'ready' | 'error';
}

interface Props {
  agent: Agent;
}

const AgentCard: React.FC<Props> = ({ agent }) => {
  const [status, setStatus] = useState<Agent['status']>(agent.status);
  const [model, setModel] = useState(agent.model);
  const [uploading, setUploading] = useState(false);

  const handleModelChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.value;
    setModel(value);
    setStatus('pending');
    try {
      await invoke('update_agent_model', { id: agent.id, model: value });
      setStatus('ready');
    } catch (e) {
      console.error(e);
      setStatus('error');
    }
  };

  const handleUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setStatus('pending');
    try {
      const arrayBuffer = await file.arrayBuffer();
      const data = Array.from(new Uint8Array(arrayBuffer));
      await invoke('upload_knowledge', { id: agent.id, data });
      setStatus('ready');
    } catch (e) {
      console.error(e);
      setStatus('error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="border rounded p-4 shadow">
      <h3 className="text-lg font-semibold">{agent.name}</h3>
      <div className="mt-2">
        <label className="block text-sm mb-1">Model</label>
        <input
          className="border p-2 rounded w-full"
          value={model}
          onChange={handleModelChange}
        />
      </div>
      <div className="mt-4">
        <input type="file" onChange={handleUpload} disabled={uploading} />
      </div>
      <p className="mt-2 text-sm">Status: {status}</p>
    </div>
  );
};

export default AgentCard;
