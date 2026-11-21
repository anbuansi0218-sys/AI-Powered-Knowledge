import { getPool, sql } from '../db/mssql.js';
import { createEmbedding, embeddingModelName } from './embeddingService.js';

export function cosineSimilarity(left, right) {
  if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length) return 0;
  let dot = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;
  for (let index = 0; index < left.length; index += 1) {
    dot += left[index] * right[index];
    leftMagnitude += left[index] ** 2;
    rightMagnitude += right[index] ** 2;
  }
  if (!leftMagnitude || !rightMagnitude) return 0;
  return dot / (Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude));
}

function isCurrentEmbedding(row, dimensions) {
  if (row.embeddingModel !== embeddingModelName) return null;
  try {
    const embedding = JSON.parse(row.embedding);
    if (
      Array.isArray(embedding) &&
      embedding.length === dimensions &&
      embedding.every(Number.isFinite)
    ) {
      return embedding;
    }
  } catch {
    return null;
  }
  return null;
}

function normalizeForMatch(text) {
  return text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

export function extractAnswerFromChunk(question, content) {
  const normalizedQuestion = normalizeForMatch(question);
  if (!normalizedQuestion) return null;

  const questionPattern = new RegExp(
    normalizedQuestion.split(' ').join('[\\s\\p{P}]+'),
    'iu'
  );
  const match = questionPattern.exec(content);
  if (!match) return null;

  let answer = content.slice(match.index + match[0].length).replace(/^[\s?!.:;,-]+/u, '');
  const answerLabel = /^(?:answer|ans|a)\s*[:.)-]\s*/iu.exec(answer);
  if (answerLabel) answer = answer.slice(answerLabel[0].length);

  const nextQuestion = /(?:^|\s)(?:question|q)\s*[:.)-]/iu.exec(answer);
  if (nextQuestion) answer = answer.slice(0, nextQuestion.index);
  else if (!answerLabel) {
    const sentenceEnd = /[.!?](?=\s|$)/u.exec(answer);
    if (sentenceEnd) answer = answer.slice(0, sentenceEnd.index + 1);
  }

  return answer.trim() || null;
}

export function rankRelevantChunks(question, chunks, limit = 5) {
  const normalizedQuestion = normalizeForMatch(question);
  return chunks
    .map((chunk) => ({
      ...chunk,
      score: chunk.score + (
        normalizedQuestion && normalizeForMatch(chunk.content).includes(normalizedQuestion) ? 1 : 0
      )
    }))
    .sort((left, right) => right.score - left.score)
    .slice(0, limit);
}

export async function retrieveRelevantChunks(question, userId, limit = 5) {
  const queryEmbedding = await createEmbedding(question);
  const pool = await getPool();
  const result = await pool.request()
    .input('userId', sql.Int, userId)
    .query(`
      SELECT dc.id AS chunkId, dc.content, e.embedding, e.model_name AS embeddingModel,
        d.id AS documentId, d.title
      FROM dbo.document_chunks dc
      JOIN dbo.documents d ON d.id = dc.document_id
      JOIN dbo.embeddings e ON e.chunk_id = dc.id
      WHERE d.user_id = @userId AND d.status = N'ready';
    `);

  const rankedChunks = [];
  for (const row of result.recordset) {
    let embedding = isCurrentEmbedding(row, queryEmbedding.length);
    if (!embedding) {
      embedding = await createEmbedding(row.content);
      await pool.request()
        .input('chunkId', sql.Int, row.chunkId)
        .input('embedding', sql.NVarChar(sql.MAX), JSON.stringify(embedding))
        .input('modelName', sql.NVarChar(100), embeddingModelName)
        .query(`
          UPDATE dbo.embeddings
          SET embedding = @embedding, model_name = @modelName
          WHERE chunk_id = @chunkId;
        `);
    }
    rankedChunks.push({
      content: row.content,
      documentId: row.documentId,
      title: row.title,
      score: cosineSimilarity(queryEmbedding, embedding)
    });
  }

  return rankRelevantChunks(question, rankedChunks, limit);
}
