import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.warn('GEMINI_API_KEY is not set. Chat routes will fail until it is configured.');
}

let geminiClient = null;

function getGeminiClient() {
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey: GEMINI_API_KEY
    });
  }
  return geminiClient;
}

const BASE_SYSTEM_PROMPT = `
You are an AI assistant for mastewal.
Answer questions about inventory and uploaded documents using the provided CONTEXT only.
If the answer is not in the CONTEXT, say you do not have that information.
When referencing book prices, always use ETB and keep the exact values from the CONTEXT.
Be concise and helpful.
Do not include source citations in the response.
`;

function buildPrompt({ contextChunks, chatHistory, userMessage }) {
  const contextText = contextChunks
    .map((chunk, idx) => {
      const label = `[source ${idx + 1}]`;
      const metaSource =
        chunk.metadata && chunk.metadata.source ? ` (${chunk.metadata.source})` : '';
      return `${label}${metaSource}:\n${chunk.text}`;
    })
    .join('\n\n');

  const historyText = (chatHistory || [])
    .map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`)
    .join('\n');

  const prompt = `
SYSTEM:
${BASE_SYSTEM_PROMPT}

CONTEXT:
${contextText || 'No specific document context was found.'}

CHAT HISTORY:
${historyText || '(no previous messages)'}

USER:
${userMessage}

ASSISTANT:
`.trim();

  return prompt;
}

export async function generateAnswer({ contextChunks, chatHistory, userMessage }) {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const client = getGeminiClient();
  const prompt = buildPrompt({ contextChunks, chatHistory, userMessage });

  const result = await client.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt
  });

  let text = '';
  if (typeof result.text === 'function') {
    text = result.text() || '';
  } else if (typeof result.text === 'string') {
    text = result.text;
  }

  const citations = contextChunks.map((chunk, idx) => ({
    sourceId: idx + 1,
    documentId: chunk.documentId ? String(chunk.documentId) : null,
    metadata: chunk.metadata || {}
  }));

  return {
    text,
    citations
  };
}

export function* chunkAnswerForStreaming(answerText, chunkSize = 60) {
  let i = 0;
  while (i < answerText.length) {
    const slice = answerText.slice(i, i + chunkSize);
    yield slice;
    i += chunkSize;
  }
}

