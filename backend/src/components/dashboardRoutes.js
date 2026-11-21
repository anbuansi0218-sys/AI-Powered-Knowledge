import { Router } from 'express';
import { getPool, sql } from '../db/mssql.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = Router();

router.get('/', asyncHandler(async (request, response) => {
  const pool = await getPool();
  const statsResult = await pool.request()
    .input('userId', sql.Int, request.user.id)
    .query(`
      SELECT
        (SELECT COUNT(*) FROM dbo.documents WHERE user_id = @userId) AS totalDocuments,
        (SELECT COUNT(*) FROM dbo.documents WHERE user_id = @userId AND status = N'ready') AS readyDocuments,
        (SELECT COUNT(*) FROM dbo.conversations WHERE user_id = @userId) AS totalChats,
        (SELECT COUNT(*) FROM dbo.chat_messages m JOIN dbo.conversations c ON c.id = m.conversation_id
          WHERE c.user_id = @userId AND m.role = N'user') AS totalQuestions,
        (SELECT COUNT(*) FROM dbo.chat_messages m JOIN dbo.conversations c ON c.id = m.conversation_id
          WHERE c.user_id = @userId AND m.role = N'assistant') AS totalAnswers;
    `);
  const stats = statsResult.recordset[0];

  const [documentsResult, chatsResult] = await Promise.all([
    pool.request()
      .input('userId', sql.Int, request.user.id)
      .query(`
        SELECT TOP (5) id, title, file_name AS originalName, status, created_at AS createdAt
        FROM dbo.documents
        WHERE user_id = @userId
        ORDER BY created_at DESC;
      `),
    pool.request()
      .input('userId', sql.Int, request.user.id)
      .query(`
        SELECT TOP (5) id, title, updated_at AS updatedAt
        FROM dbo.conversations
        WHERE user_id = @userId
        ORDER BY updated_at DESC;
      `)
  ]);

  await pool.request()
    .input('userId', sql.Int, request.user.id)
    .input('totalDocuments', sql.Int, stats.totalDocuments)
    .input('readyDocuments', sql.Int, stats.readyDocuments)
    .input('totalChats', sql.Int, stats.totalChats)
    .input('totalQuestions', sql.Int, stats.totalQuestions)
    .input('totalAnswers', sql.Int, stats.totalAnswers)
    .query(`
      IF EXISTS (SELECT 1 FROM dbo.dashboard WHERE user_id = @userId)
        UPDATE dbo.dashboard
        SET total_documents = @totalDocuments,
            ready_documents = @readyDocuments,
            total_chats = @totalChats,
            total_questions = @totalQuestions,
            total_answers = @totalAnswers,
            snapshot_at = SYSUTCDATETIME()
        WHERE user_id = @userId;
      ELSE
        INSERT INTO dbo.dashboard
          (user_id, total_documents, ready_documents, total_chats, total_questions, total_answers)
        VALUES
          (@userId, @totalDocuments, @readyDocuments, @totalChats, @totalQuestions, @totalAnswers);
    `);

  response.json({
    stats,
    recentDocuments: documentsResult.recordset,
    recentChats: chatsResult.recordset
  });
}));

export default router;
