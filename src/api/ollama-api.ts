export async function generateResponse(prompt: string, model: string = 'llama3'): Promise<string> {
  try {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt,
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`);
    }

    const data = await response.json();
    return data.response || '';
  } catch (error) {
    console.error('Ollama API error:', error);
    throw new Error('Impossible de contacter Ollama. Assurez-vous qu\'il est lancé.');
  }
}

export async function getAvailableModels(): Promise<string[]> {
  try {
    const response = await fetch('http://localhost:11434/api/tags');
    const data = await response.json();
    return data.models?.map((m: any) => m.name) || ['llama3', 'phi3', 'mistral'];
  } catch (error) {
    console.error('Error fetching models:', error);
    return ['llama3', 'phi3', 'mistral'];
  }
}
