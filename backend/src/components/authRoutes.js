import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { getPool, sql } from '../db/mssql.js';
import { createAccessToken } from '../services/authService.js';
import asyncHandler from '../utils/asyncHandler.js';
import requireAuth from '../middleware/requireAuth.js';

const router = Router();
const passwordHashRounds = 12;
const dummyHash = bcrypt.hash(
  'not-a-real-account-password',
  passwordHashRounds
);
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function passwordIsValid(password) {
  return typeof password === 'string' &&
    password.length >= 12 &&
    Buffer.byteLength(password, 'utf8') <= 72;
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  };
}

function authResponse(user, response, message, status = 200) {
  response.status(status).json({
    message,
    userId: user.id,
    name: user.name,
    email: user.email,
    token: createAccessToken(user)
  });
}

function isDuplicateEmailError(error) {
  return error.number === 2601 ||
    error.number === 2627 ||
    error.originalError?.number === 2601 ||
    error.originalError?.number === 2627;
}

router.post('/register', asyncHandler(async (request, response) => {
  const body = request.body || {};
  const submittedName = body.userName ?? body.name;
  const name = typeof submittedName === 'string' ? submittedName.trim() : '';
  const email = normalizeEmail(body.email);
  const { password } = body;

  if (name.length < 1 || name.length > 100) {
    response.status(400).json({ error: 'Name must contain between 1 and 100 characters.' });
    return;
  }
  if (email.length > 150 || !emailPattern.test(email)) {
    response.status(400).json({ error: 'Enter a valid email address.' });
    return;
  }
  if (!passwordIsValid(password)) {
    response.status(400).json({ error: 'Password must be at least 12 characters and no more than 72 UTF-8 bytes.' });
    return;
  }

  const pool = await getPool();
  const existing = await pool.request()
    .input('email', sql.NVarChar(150), email)
    .query('SELECT id FROM dbo.users WHERE email = @email;');
  if (existing.recordset.length > 0) {
    response.status(409).json({ error: 'An account with this email already exists.' });
    return;
  }

  const passwordHash = await bcrypt.hash(password, passwordHashRounds);
  const transaction = new sql.Transaction(pool);
  await transaction.begin();
  let created;
  try {
    const login = await new sql.Request(transaction)
      .input('passwordHash', sql.NVarChar(sql.MAX), passwordHash)
      .query(`
        INSERT INTO dbo.user_login (password_hash)
        OUTPUT INSERTED.id
        VALUES (@passwordHash);
      `);
    created = await new sql.Request(transaction)
      .input('name', sql.NVarChar(100), name)
      .input('email', sql.NVarChar(150), email)
      .input('userLoginId', sql.Int, login.recordset[0].id)
      .query(`
        INSERT INTO dbo.users (name, email, user_login_id, role, is_active)
        OUTPUT INSERTED.id, INSERTED.name, INSERTED.email, INSERTED.role
        VALUES (@name, @email, @userLoginId, N'user', 1);
      `);
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    if (isDuplicateEmailError(error)) {
      response.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }
    throw error;
  }

  authResponse(created.recordset[0], response, 'Registration successful.', 201);
}));

router.post('/login', asyncHandler(async (request, response) => {
  const body = request.body || {};
  const email = normalizeEmail(body.email);
  const { password } = body;
  if (
    email.length > 150 ||
    !emailPattern.test(email) ||
    typeof password !== 'string' ||
    Buffer.byteLength(password, 'utf8') > 72
  ) {
    response.status(400).json({ error: 'Enter a valid email address and password.' });
    return;
  }

  const pool = await getPool();
  const result = await pool.request()
    .input('email', sql.NVarChar(150), email)
    .query(`
      SELECT u.id, u.name, u.email, ul.password_hash AS passwordHash,
        u.role, u.is_active AS isActive
      FROM dbo.users u
      LEFT JOIN dbo.user_login ul ON ul.id = u.user_login_id
      WHERE u.email = @email;
    `);
  const user = result.recordset[0];
  const hash = user?.passwordHash || await dummyHash;
  const passwordMatches = await bcrypt.compare(password, hash);
  if (!user || !user.isActive || !user.passwordHash || !passwordMatches) {
    response.status(401).json({ error: 'Email or password is incorrect.' });
    return;
  }

  authResponse(user, response, 'Login successful.');
}));

router.get('/me', requireAuth, asyncHandler(async (request, response) => {
  const pool = await getPool();
  const result = await pool.request()
    .input('id', sql.Int, request.user.id)
    .query('SELECT id, name, email, role FROM dbo.users WHERE id = @id AND is_active = 1;');
  const user = result.recordset[0];
  if (!user) {
    response.status(401).json({ error: 'Account is unavailable.' });
    return;
  }
  response.json({ user: publicUser(user) });
}));

export default router;
