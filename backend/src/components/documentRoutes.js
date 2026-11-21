import { Router } from 'express';
import multer from 'multer';
import pdfParse from 'pdf-parse';
import { mkdir, readFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { getPool, sql } from '../db/mssql.js';
import { createEmbedding, embeddingModelName } from '../services/embeddingService.js';
import asyncHandler from '../utils/asyncHandler.js';
import { chunkText } from '../utils/chunkText.js';
import parseId from '../utils/parseId.js';

const router = Router();
const uploadDirectory = path.resolve('uploads');
const upload = multer({
  storage: multer.diskStorage({
    destination: (_request, _file, callback) => {
      mkdir(uploadDirectory, { recursive: true })
        .then(() => callback(null, uploadDirectory))
        .catch(callback);
    },
    filename: (_request, file, callback) => {
      callback(null, `${randomUUID()}${path.extname(file.originalname).toLowerCase()}`);
    }
  }),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_request, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    if (!['.pdf', '.txt'].includes(extension)) {
      const error = new Error('Only PDF and TXT documents are supported.');
      error.status = 400;
      callback(error);
      return;
    }
    callback(null, true);
  }
});

router.get('/', asyncHandler(async (request, response) => {
  const pool = await getPool();
  const result = await pool.request()
    .input('userId', sql.Int, request.user.id)
    .query(`
      SELECT id, title, file_name AS originalName,
        CASE file_type
          WHEN N'PDF' THEN N'application/pdf'
          WHEN N'TXT' THEN N'text/plain'
          WHEN N'DOCX' THEN N'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          ELSE N'application/octet-stream'
        END AS mimeType,
        file_type AS fileType,
        file_size AS fileSize, status, created_at AS createdAt
      FROM dbo.documents
      WHERE user_id = @userId
      ORDER BY created_at DESC;
    `);
  response.json({
    documents: result.recordset.map((document) => ({
      ...document,
      fileSize: Number(document.fileSize),
    }))
  });
}));

router.post('/upload', upload.single('file'), asyncHandler(async (request, response) => {
  if (!request.file) {
    response.status(400).json({ error: 'Choose a PDF or TXT file to upload.' });
    return;
  }

  try {
    const fileBuffer = await readFile(request.file.path);
    const extracted = path.extname(request.file.originalname).toLowerCase() === '.pdf'
      ? (await pdfParse(fileBuffer)).text
      : fileBuffer.toString('utf8');
    const chunks = chunkText(extracted);
    if (chunks.length === 0) {
      const error = new Error('No readable text was found in the document.');
      error.status = 400;
      throw error;
    }

    const embeddings = [];
    for (const chunk of chunks) embeddings.push(await createEmbedding(chunk));

    const title = path.basename(request.file.originalname, path.extname(request.file.originalname));
    const pool = await getPool();
    const transaction = new sql.Transaction(pool);
    await transaction.begin();
    let document;
    try {
      const inserted = await new sql.Request(transaction)
        .input('userId', sql.Int, request.user.id)
        .input('title', sql.NVarChar(255), title)
        .input('fileName', sql.NVarChar(255), request.file.originalname)
        .input('filePath', sql.NVarChar(500), request.file.path)
        .input('fileType', sql.NVarChar(50), path.extname(request.file.originalname).slice(1).toUpperCase())
        .input('fileSize', sql.BigInt, request.file.size)
        .input('totalChunks', sql.Int, chunks.length)
        .query(`
          INSERT INTO dbo.documents
            (user_id, title, file_name, file_path, file_type, file_size, status, total_chunks)
          OUTPUT INSERTED.id, INSERTED.title, INSERTED.status
          VALUES
            (@userId, @title, @fileName, @filePath, @fileType, @fileSize, N'ready', @totalChunks);
        `);
      document = inserted.recordset[0];

      for (let index = 0; index < chunks.length; index += 1) {
        const insertedChunk = await new sql.Request(transaction)
          .input('documentId', sql.Int, document.id)
          .input('chunkIndex', sql.Int, index)
          .input('content', sql.NVarChar(sql.MAX), chunks[index])
          .query(`
            INSERT INTO dbo.document_chunks (document_id, chunk_index, content)
            OUTPUT INSERTED.id
            VALUES (@documentId, @chunkIndex, @content);
          `);
        await new sql.Request(transaction)
          .input('chunkId', sql.Int, insertedChunk.recordset[0].id)
          .input('embedding', sql.NVarChar(sql.MAX), JSON.stringify(embeddings[index]))
          .input('modelName', sql.NVarChar(100), embeddingModelName)
          .query(`
            INSERT INTO dbo.embeddings (chunk_id, embedding, model_name)
            VALUES (@chunkId, @embedding, @modelName);
          `);
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }

    response.status(201).json({
      document: {
        id: document.id,
        title: document.title,
        status: document.status,
        chunkCount: chunks.length
      }
    });
  } catch (error) {
    await unlink(request.file.path).catch((unlinkError) => {
      if (unlinkError.code !== 'ENOENT') console.error('Unable to remove failed upload:', unlinkError);
    });
    throw error;
  }
}));

router.delete('/:id', asyncHandler(async (request, response) => {
  const id = parseId(request.params.id, 'document id');
  const pool = await getPool();
  const result = await pool.request()
    .input('id', sql.Int, id)
    .input('userId', sql.Int, request.user.id)
    .query(`
      SELECT id, file_path AS storagePath
      FROM dbo.documents
      WHERE id = @id AND user_id = @userId;
    `);
  const document = result.recordset[0];
  if (!document) {
    response.status(404).json({ error: 'Document not found.' });
    return;
  }

  await pool.request()
    .input('id', sql.Int, document.id)
    .query('DELETE FROM dbo.documents WHERE id = @id;');
  await unlink(document.storagePath).catch((error) => {
    if (error.code !== 'ENOENT') throw error;
  });
  response.status(204).end();
}));

export default router;
