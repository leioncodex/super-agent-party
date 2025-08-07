const API_URL = "http://localhost:8080";
const EMBEDDING_SIZE = 384;

type VectorItem = {
  id: string;
  text: string;
  embedding: number[];
};

let vectorStore: VectorItem[] = [];

export function initVectorStore() {
  vectorStore = [];
}

export async function addToVectorStore(id: string, text: string) {
  const embedding = await generateEmbedding(text);
  if (embedding.length !== EMBEDDING_SIZE) {
    throw new Error(`Embedding size mismatch: expected ${EMBEDDING_SIZE}, got ${embedding.length}`);
  }
  vectorStore.push({ id, text, embedding });
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function queryVectorStore(query: string, topK = 5) {
  const queryEmbedding = await generateEmbedding(query);
  if (queryEmbedding.length !== EMBEDDING_SIZE) {
    throw new Error(`Embedding size mismatch: expected ${EMBEDDING_SIZE}, got ${queryEmbedding.length}`);
  }
  return vectorStore
    .map((item) => ({ ...item, score: cosineSimilarity(queryEmbedding, item.embedding) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch(`${API_URL}/api/embeddings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ input: text })
  });

  if (!response.ok) {
    throw new Error(`Failed to generate embedding: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const embedding = data.embedding || data.data?.[0]?.embedding || data.data;
  if (!Array.isArray(embedding) || embedding.some((v: any) => typeof v !== "number")) {
    throw new Error("Invalid embedding response format");
  }
  return embedding as number[];
}
