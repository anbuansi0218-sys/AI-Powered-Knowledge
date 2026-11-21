import cors from 'cors';
import express from 'express';
import authRoutes from './components/authRoutes.js';
import chatRoutes from './components/chatRoutes.js';
import dashboardRoutes from './components/dashboardRoutes.js';
import documentRoutes from './components/documentRoutes.js';
import settingsRoutes from './components/settingsRoutes.js';
import requireAuth from './middleware/requireAuth.js';

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5001' }));
app.use(express.json({ limit: '1mb' }));
app.get('/api/health', (_request, response) => response.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api', requireAuth);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/settings', settingsRoutes);

app.use((error, _request, response, _next) => {
  console.error(error);
  if (typeof error.retryAfter === 'string' && /^\d{1,6}$/.test(error.retryAfter)) {
    response.set('Retry-After', error.retryAfter);
  }
  if (error instanceof SyntaxError && 'body' in error) {
    response.status(400).json({ error: 'Request body contains invalid JSON.' });
    return;
  }
  if (error.name === 'MulterError') {
    response.status(400).json({
      error: error.code === 'LIMIT_FILE_SIZE'
        ? 'The file exceeds the 15 MB upload limit.'
        : error.message
    });
    return;
  }
  response.status(error.status || 500).json({
    error: error.status ? error.message : 'An unexpected server error occurred.'
  });
});

export default app;
