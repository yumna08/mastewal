import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

const EMBEDDING_PROVIDER = (process.env.EMBEDDING_PROVIDER || 'voyage').toLowerCase();
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const VOYAGE_API_KEY = process.env.VOYAGE_API_KEY;
const EMBEDDING_DIMENSIONS = Number(process.env.EMBEDDING_DIMENSIONS || 1024);

const TaskType = {
  RETRIEVAL_DOCUMENT: 'RETRIEVAL_DOCUMENT',
  RETRIEVAL_QUERY: 'RETRIEVAL_QUERY'
};

async function embedWithVoyage(input, taskType) {
  if (!VOYAGE_API_KEY) {
    throw new Error('VOYAGE_API_KEY is not set');
  }

  const model = 'voyage-4-large';
  const url = 'https://api.voyageai.com/v1/embeddings';

  // Newer Voyage API no longer accepts "task_type" in the body,
  // so we only send model + input to avoid 400 errors.
  const body = {
    model,
    input
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${VOYAGE_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Voyage embeddings error: ${res.status} ${text}`);
  }

  const json = await res.json();
  return json.data.map((item) => item.embedding);
}

let geminiEmbeddingClient = null;

function getGeminiEmbeddingClient() {
  if (!geminiEmbeddingClient) {
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not set');
    }
    geminiEmbeddingClient = new GoogleGenAI({
      apiKey: GEMINI_API_KEY
    });
  }
  return geminiEmbeddingClient;
}

async function embedWithGemini(input, taskType) {
  const client = getGeminiEmbeddingClient();
  const modelName = 'gemini-embedding-001';

  const inputs = Array.isArray(input) ? input : [input];

  const response = await client.models.embedContent({
    model: modelName,
    contents: inputs
  });

  const embeddings = (response.embeddings || []).map(
    (e) => e.values || e.embedding || []
  );
  return embeddings;
}

async function embedTexts(texts, taskType) {
  const inputArray = Array.isArray(texts) ? texts : [texts];

  let embeddings;
  if (EMBEDDING_PROVIDER === 'gemini') {
    embeddings = await embedWithGemini(inputArray, taskType);
  } else {
    embeddings = await embedWithVoyage(inputArray, taskType);
  }

  const normalized = embeddings.map((vec) => {
    if (!Array.isArray(vec)) return [];
    if (EMBEDDING_DIMENSIONS && vec.length !== EMBEDDING_DIMENSIONS) {
    }
    return vec.map((v) => Number(v));
  });

  return normalized;
}

export async function embedDocumentText(text) {
  const [embedding] = await embedTexts(text, TaskType.RETRIEVAL_DOCUMENT);
  return embedding;
}

export async function embedQueryText(text) {
  const [embedding] = await embedTexts(text, TaskType.RETRIEVAL_QUERY);
  return embedding;
}

export { TaskType };

