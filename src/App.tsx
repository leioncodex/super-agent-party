import React, { useState, useEffect } from 'react';
import { Orchestrator } from './orchestrator';
import { AgentCreator } from './agentCreator';

const OrchestratorPanel: React.FC<{ orchestrator: Orchestrator }> = ({ orchestrator }) => {
  const [goal, setGoal] = useState('');
  const [response, setResponse] = useState('');

  const run = async () => {
    const res = await orchestrator.runTask(goal);
    setResponse(res);
  };

  return (
    <div>
      <input
        value={goal}
        onChange={(e) => setGoal(e.target.value)}
        placeholder="Enter objective"
      />
      <button onClick={run}>Run</button>
      {response && <div className="response">{response}</div>}
    </div>
  );
};

const App: React.FC = () => {
  const [orchestrator] = useState(() => new Orchestrator(new AgentCreator()));
  const [suggestion, setSuggestion] = useState('');

  useEffect(() => {
    const id = setInterval(async () => {
      const next = await orchestrator.autoSuggestNextStep();
      setSuggestion(next);
    }, 30000);
    return () => clearInterval(id);
  }, [orchestrator]);

  return (
    <div>
      <header>
        <h1>Super Agent Party</h1>
        {suggestion && <div className="suggestion">{suggestion}</div>}
      </header>
      <OrchestratorPanel orchestrator={orchestrator} />
    </div>
  );
};

export default App;
