import { getPool, sql } from '../db/mssql.js';
import { verifyAccessToken } from '../services/authService.js';
import asyncHandler from '../utils/asyncHandler.js';

function unauthorized(response) {
  response.status(401).json({ error: 'A valid bearer token is required.' });
}

const requireAuth = asyncHandler(async (request, response, next) => {
  const authorization = request.get('authorization') || '';
  const match = /^Bearer\s+([^\s]+)$/i.exec(authorization);
  if (!match) {
    unauthorized(response);
    return;
  }

  let claims;
  try {
    claims = verifyAccessToken(match[1]);
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      unauthorized(response);
      return;
    }
    throw error;
  }

  if (
    !claims ||
    typeof claims !== 'object' ||
    typeof claims.sub !== 'string' ||
    !/^[1-9]\d*$/.test(claims.sub)
  ) {
    unauthorized(response);
    return;
  }

  const userId = Number(claims.sub);
  if (!Number.isSafeInteger(userId)) {
    unauthorized(response);
    return;
  }

  const pool = await getPool();
  const result = await pool.request()
    .input('id', sql.Int, userId)
    .query(`
      SELECT id, email, role
      FROM dbo.users
      WHERE id = @id AND is_active = 1;
    `);
  const user = result.recordset[0];
  if (!user) {
    unauthorized(response);
    return;
  }

  request.user = user;
  next();
});

export default requireAuth;
