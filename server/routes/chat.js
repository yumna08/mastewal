import express from 'express';
import mongoose from 'mongoose';
import Chunk from '../models/Chunk.js';
import ChatSession from '../models/ChatSession.js';
import { embedQueryText } from '../services/embeddings.js';
import { generateAnswer, chunkAnswerForStreaming } from '../services/gemini.js';

const router = express.Router();

const VECTOR_INDEX_NAME = process.env.VECTOR_INDEX_NAME || 'chunk_vector_index';

// List chat sessions for current user
// GET /api/chat/sessions
router.get('/sessions', async (req, res) => {
  try {
    const sessions = await ChatSession.find({ userId: req.user.id })
      .sort({ updatedAt: -1 })
      .select('_id');

    res.json({ sessions });
  } catch (err) {
    console.error('List chat sessions error:', err);
    res.status(500).json({ error: 'Failed to load chat sessions' });
  }
});

// Get a specific chat session
// GET /api/chat/sessions/:id
router.get('/sessions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const session = await ChatSession.findOne({
      _id: id,
      userId: req.user.id
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({
      session: {
        _id: session._id,
        messages: session.messages.map((m) => ({
          _id: undefined,
          role: m.role,
          content: m.content,
          createdAt: m.createdAt
        })),
        updatedAt: session.updatedAt
      }
    });
  } catch (err) {
    console.error('Get chat session error:', err);
    res.status(500).json({ error: 'Failed to load chat session' });
  }
});

async function runRagChatTurn({ userId, sessionId, message }) {
  let session;
  if (sessionId) {
    session = await ChatSession.findOne({ _id: sessionId, userId });
  }
  if (!session) {
    session = await ChatSession.create({
      userId,
      messages: []
    });
  }

  session.messages.push({
    role: 'user',
    content: message
  });

  const queryEmbedding = await embedQueryText(message);

  const db = mongoose.connection.db;
  // Match the non-GridFS collection name used by the Chunk model
  const collection = db.collection('rag_chunks');

  const topK = 8;

  const results = await collection
    .aggregate([
      {
        $vectorSearch: {
          index: VECTOR_INDEX_NAME,
          path: 'embedding',
          queryVector: queryEmbedding,
          numCandidates: 100,
          limit: topK
        }
      }
    ])
    .toArray();

  let contextChunks = results.map((doc) => ({
    text: doc.text,
    documentId: doc.documentId,
    metadata: doc.metadata || {}
  }));

  if (contextChunks.length === 0) {
    const rawTokens = String(message)
      .toLowerCase()
      .match(/[a-z0-9']{3,}/g);
    const stopwords = new Set(['the', 'and', 'for', 'with', 'book', 'price', 'how', 'much', 'what', 'are', 'is', 'about']);
    const tokens = Array.from(new Set((rawTokens || []).filter((token) => !stopwords.has(token))));
    if (tokens.length > 0) {
      const regex = new RegExp(tokens.join('|'), 'i');
      const fallback = await Chunk.find({ text: regex })
        .sort({ createdAt: -1 })
        .limit(topK)
        .lean();
      contextChunks = fallback.map((doc) => ({
        text: doc.text,
        documentId: doc.documentId,
        metadata: doc.metadata || {}
      }));
    }
  }

  const historyForPrompt = session.messages.slice(-10);

  const { text: answerText, citations } = await generateAnswer({
    contextChunks,
    chatHistory: historyForPrompt,
    userMessage: message
  });

  session.messages.push({
    role: 'assistant',
    content: answerText
  });
  await session.save();

  return {
    sessionId: session._id,
    answerText,
    citations,
    contextChunks
  };
}

router.post('/', async (req, res) => {
  try {
    const { message, sessionId } = req.body || {};
    const userId = req.user.id;

    if (!message) {
      return res.status(400).json({ error: 'message is required' });
    }

    const result = await runRagChatTurn({ userId, sessionId, message });

    res.json({
      sessionId: result.sessionId,
      answer: result.answerText,
      citations: result.citations
    });
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: 'Failed to process chat message' });
  }
});

router.get('/stream', async (req, res) => {
  const { q, sessionId } = req.query || {};
  const message = q;
  const userId = req.user.id;

  if (!message) {
    return res.status(400).json({ error: 'q (query) is required' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  try {
    const result = await runRagChatTurn({ userId, sessionId, message });

    const metaPayload = JSON.stringify({
      sessionId: result.sessionId,
      citations: result.citations
    });
    res.write(`event: meta\n`);
    res.write(`data: ${metaPayload}\n\n`);

    for (const chunk of chunkAnswerForStreaming(result.answerText)) {
      const payload = JSON.stringify({ text: chunk });
      res.write(`event: message\n`);
      res.write(`data: ${payload}\n\n`);
    }

    res.write(`event: done\n`);
    res.write(`data: {}\n\n`);

    res.end();
  } catch (err) {
    console.error('Streaming chat error:', err);
    try {
      const payload = JSON.stringify({ error: 'Failed to process chat message' });
      res.write(`event: error\n`);
      res.write(`data: ${payload}\n\n`);
      res.end();
    } catch {
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to process chat message' });
      }
    }
  }
});

export default router;

