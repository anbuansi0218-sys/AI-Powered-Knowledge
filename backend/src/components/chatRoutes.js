import { Router } from 'express';
import { getPool, sql } from '../db/mssql.js';
import { generateAnswer, noDocumentAnswer } from '../services/llmService.js';
import { evaluateArithmeticQuestion } from '../services/mathService.js';
import { extractAnswerFromChunk, retrieveRelevantChunks } from '../services/ragService.js';
import { searchWeb } from '../services/webSearchService.js';
import asyncHandler from '../utils/asyncHandler.js';
import parseId from '../utils/parseId.js';

const router = Router();

function parseSources(value) {
  return value === null ? null : JSON.parse(value);
}

router.get('/', asyncHandler(async (request, response) => {
  const pool = await getPool();
  const result = await pool.request()
    .input('userId', sql.Int, request.user.id)
    .query(`
      SELECT id, title, created_at AS createdAt, updated_at AS updatedAt
      FROM dbo.conversations
      WHERE user_id = @userId
      ORDER BY updated_at DESC;
    `);
  response.json({ chats: result.recordset });
}));

router.get('/:id', asyncHandler(async (request, response) => {
  const id = parseId(request.params.id, 'conversation id');
  const pool = await getPool();
  const chatResult = await pool.request()
    .input('id', sql.Int, id)
    .input('userId', sql.Int, request.user.id)
    .query(`
      SELECT id, title, created_at AS createdAt
      FROM dbo.conversations
      WHERE id = @id AND user_id = @userId;
    `);
  const chat = chatResult.recordset[0];
  if (!chat) {
    response.status(404).json({ error: 'Conversation not found.' });
    return;
  }

  const historyResult = await pool.request()
    .input('chatId', sql.Int, id)
    .query(`
      SELECT id, [role], content, sources, created_at AS createdAt
      FROM dbo.chat_messages
      WHERE conversation_id = @chatId
      ORDER BY id ASC;
    `);
  response.json({
    chat,
    messages: historyResult.recordset.map((message) => ({
      ...message,
      sources: parseSources(message.sources)
    }))
  });
}));

router.post('/', asyncHandler(async (request, response) => {
  const question = typeof request.body.question === 'string' ? request.body.question.trim() : '';
  if (!question || question.length > 4000) {
    response.status(400).json({ error: 'Question must contain between 1 and 4000 characters.' });
    return;
  }

  const pool = await getPool();
  let chatId;
  if (request.body.chatId !== undefined && request.body.chatId !== null && request.body.chatId !== '') {
    chatId = parseId(request.body.chatId, 'conversation id');
    const existing = await pool.request()
      .input('id', sql.Int, chatId)
      .input('userId', sql.Int, request.user.id)
      .query('SELECT id FROM dbo.conversations WHERE id = @id AND user_id = @userId;');
    if (existing.recordset.length === 0) {
      response.status(404).json({ error: 'Conversation not found.' });
      return;
    }
  } else {
    const title = question.length > 80 ? `${question.slice(0, 77)}...` : question;
    const created = await pool.request()
      .input('title', sql.NVarChar(255), title)
      .input('userId', sql.Int, request.user.id)
      .query(`
        INSERT INTO dbo.conversations (user_id, title)
        OUTPUT INSERTED.id
        VALUES (@userId, @title);
      `);
    chatId = created.recordset[0].id;
  }

  await pool.request()
    .input('chatId', sql.Int, chatId)
    .input('role', sql.NVarChar(20), 'user')
    .input('content', sql.NVarChar(sql.MAX), question)
    .query(`
      INSERT INTO dbo.chat_messages (conversation_id, [role], content)
      VALUES (@chatId, @role, @content);
      UPDATE dbo.conversations SET updated_at = SYSUTCDATETIME() WHERE id = @chatId;
    `);

  let answer = evaluateArithmeticQuestion(question);
  let sources = answer === null ? undefined : [];

  if (answer === null) {
    const chunks = await retrieveRelevantChunks(question, request.user.id);
    const settingsResult = await pool.request()
      .input('id', sql.Int, request.user.id)
      .query('SELECT chat_model AS chatModel, temperature FROM dbo.users WHERE id = @id;');
    const settings = settingsResult.recordset[0];
    const documentAnswer = chunks
      .map((chunk) => ({ chunk, answer: extractAnswerFromChunk(question, chunk.content) }))
      .find((match) => match.answer);

    if (documentAnswer) {
      answer = documentAnswer.answer;
      sources = [{ documentId: documentAnswer.chunk.documentId, title: documentAnswer.chunk.title }];
    } else if (chunks.length) {
      const documentContext = chunks
        .map((chunk, index) => `[${index + 1}] ${chunk.title}\n${chunk.content}`)
        .join('\n\n');
      try {
        answer = await generateAnswer(
          question,
          documentContext,
          settings?.chatModel,
          settings?.temperature
        );
      } catch (error) {
        if (error.status !== 402) throw error;
        answer = noDocumentAnswer;
      }
      if (answer !== noDocumentAnswer) {
        sources = [...new Map(chunks.map((chunk) => [
          chunk.documentId,
          { documentId: chunk.documentId, title: chunk.title }
        ])).values()];
      }
    }

    if (!answer || answer === noDocumentAnswer) {
      const webSearch = await searchWeb(question);
      if (!webSearch.results.length) {
        answer = "I couldn't find relevant information in the uploaded documents or web search.";
        sources = [];
      } else {
        answer = webSearch.answer || webSearch.results
          .map((result) => `${result.title}: ${result.content}`)
          .join('\n\n');
        sources = webSearch.results.map((result) => ({
          type: 'web',
          title: result.title,
          url: result.url
        }));
      }
    }
  }
  const messageResult = await pool.request()
    .input('chatId', sql.Int, chatId)
    .input('role', sql.NVarChar(20), 'assistant')
    .input('content', sql.NVarChar(sql.MAX), answer)
    .input('sources', sql.NVarChar(sql.MAX), JSON.stringify(sources))
    .query(`
      INSERT INTO dbo.chat_messages (conversation_id, [role], content, sources)
      OUTPUT INSERTED.id, INSERTED.[role] AS role, INSERTED.content
      VALUES (@chatId, @role, @content, @sources);
      UPDATE dbo.conversations SET updated_at = SYSUTCDATETIME() WHERE id = @chatId;
    `);

  response.status(201).json({
    chatId,
    message: { ...messageResult.recordset[0], sources }
  });
}));

router.delete('/:id', asyncHandler(async (request, response) => {
  const id = parseId(request.params.id, 'conversation id');
  const pool = await getPool();
  const result = await pool.request()
    .input('id', sql.Int, id)
    .input('userId', sql.Int, request.user.id)
    .query(`
      DELETE FROM dbo.conversations
      WHERE id = @id AND user_id = @userId;
    `);
  if (result.rowsAffected[0] === 0) {
    response.status(404).json({ error: 'Conversation not found.' });
    return;
  }
  response.status(204).end();
}));

export default router;
