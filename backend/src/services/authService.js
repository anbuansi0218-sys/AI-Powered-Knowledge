import jwt from 'jsonwebtoken';

const JWT_ISSUER = 'knowledge-assistant';
const JWT_AUDIENCE = 'knowledge-assistant-api';

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || Buffer.byteLength(secret, 'utf8') < 32) {
    throw new Error('JWT_SECRET must be configured with at least 32 bytes.');
  }
  return secret;
}

function getTokenLifetime() {
  const lifetime = process.env.JWT_EXPIRES_IN || '1h';
  if (!/^[1-9]\d*[smhd]$/.test(lifetime)) {
    throw new Error('JWT_EXPIRES_IN must be a positive duration such as 15m or 1h.');
  }
  return lifetime;
}

export function validateAuthConfiguration() {
  getJwtSecret();
  getTokenLifetime();
}

export function createAccessToken(user) {
  return jwt.sign(
    { email: user.email, role: user.role },
    getJwtSecret(),
    {
      algorithm: 'HS256',
      audience: JWT_AUDIENCE,
      expiresIn: getTokenLifetime(),
      issuer: JWT_ISSUER,
      subject: String(user.id)
    }
  );
}

export function verifyAccessToken(token) {
  return jwt.verify(token, getJwtSecret(), {
    algorithms: ['HS256'],
    audience: JWT_AUDIENCE,
    issuer: JWT_ISSUER
  });
}
