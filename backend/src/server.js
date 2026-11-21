import 'dotenv/config';
import app from './app.js';
import { connectDatabase, disconnectDatabase } from './db/mssql.js';
import { validateAuthConfiguration } from './services/authService.js';

const port = Number(process.env.PORT || 5000);
let server;

try {
  validateAuthConfiguration();
  await connectDatabase();
  server = app.listen(port, () => {
    console.log(`Knowledge Assistant API listening on http://localhost:${port}`);
  });
} catch (error) {
  console.error('Unable to start the API. Check the SQL Server configuration and availability.', error);
  process.exitCode = 1;
}

async function shutdown() {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await disconnectDatabase();
}

process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
