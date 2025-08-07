import { AgentCreator } from './components/AgentCreator';
import { Orchestrator } from './core/orchestrator';
import { useState } from 'react';

function App() {
  const [orchestrator] = useState(() => new Orchestrator());
  const [input, setInput] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    setIsLoading(true);
    try {
      await orchestrator.setGoal(input);
      const result = await orchestrator.runTask(
        input, 
        ['general']
      );
      setResponse(result);
    } catch (e) {
      setResponse("Erreur lors de l'exécution");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="p-4 border-b bg-white">
        <h1 className="text-2xl font-bold">Super Agent Party</h1>
      </header>

      <main className="p-4">
        <AgentCreator />
        
        <div className="mt-6 border rounded-lg p-4 bg-white">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Décris ton objectif..."
              className="flex-1 p-2 border rounded"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="bg-purple-600 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              {isLoading ? 'En cours...' : 'Lancer'}
            </button>
          </form>
          
          {response && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <h3 className="font-medium mb-2">Réponse :</h3>
              <p>{response}</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
