import { Router } from 'express';
import { getPool, sql } from '../db/mssql.js';
import { getChatModel } from '../services/llmService.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = Router();

router.get('/', asyncHandler(async (request, response) => {
  const pool = await getPool();
  const result = await pool.request()
    .input('id', sql.Int, request.user.id)
    .query(`
      SELECT name AS profileName, temperature
      FROM dbo.users
      WHERE id = @id;
    `);
  const profile = result.recordset[0];
  response.json({
    settings: {
      ...(profile || { profileName: 'Knowledge User', temperature: 0.2 }),
      chatModel: getChatModel()
    }
  });
}));

router.put('/', asyncHandler(async (request, response) => {
  const { profileName, chatModel, temperature } = request.body;
  if (
    typeof profileName !== 'string' || profileName.trim().length < 1 || profileName.trim().length > 100 ||
    typeof chatModel !== 'string' || chatModel.trim() !== getChatModel() ||
    !Number.isFinite(Number(temperature)) || Number(temperature) < 0 || Number(temperature) > 2
  ) {
    response.status(400).json({ error: 'Enter a profile name, the configured Hugging Face model, and a temperature from 0 to 2.' });
    return;
  }

  const pool = await getPool();
  const result = await pool.request()
    .input('id', sql.Int, request.user.id)
    .input('profileName', sql.NVarChar(100), profileName.trim())
    .input('chatModel', sql.NVarChar(120), chatModel.trim())
    .input('temperature', sql.Float, Number(temperature))
    .query(`
      UPDATE dbo.users
      SET name = @profileName,
          chat_model = @chatModel,
          temperature = @temperature,
          updated_at = SYSUTCDATETIME()
      OUTPUT INSERTED.name AS profileName,
        INSERTED.chat_model AS chatModel, INSERTED.temperature
      WHERE id = @id;
    `);
  const settings = result.recordset[0];
  response.json({ settings });
}));

export default router;
