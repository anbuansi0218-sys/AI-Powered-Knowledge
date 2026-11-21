import sql from 'mssql';

let poolPromise;

function getConfig() {
  const required = ['MSSQL_SERVER', 'MSSQL_DATABASE', 'MSSQL_USER', 'MSSQL_PASSWORD'];
  const missing = required.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    throw new Error(`Missing SQL Server configuration: ${missing.join(', ')}`);
  }

  const instanceName = process.env.MSSQL_INSTANCE?.trim();
  const port = Number(process.env.MSSQL_PORT || 1433);
  if (!instanceName && (!Number.isInteger(port) || port < 1 || port > 65535)) {
    throw new Error('MSSQL_PORT must be a valid TCP port.');
  }

  return {
    server: process.env.MSSQL_SERVER,
    ...(instanceName ? {} : { port }),
    database: process.env.MSSQL_DATABASE,
    user: process.env.MSSQL_USER,
    password: process.env.MSSQL_PASSWORD,
    options: {
      encrypt: process.env.MSSQL_ENCRYPT !== 'false',
      trustServerCertificate: process.env.MSSQL_TRUST_SERVER_CERTIFICATE === 'true',
      ...(instanceName ? { instanceName } : {})
    },
    pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
    connectionTimeout: 15000,
    requestTimeout: 30000
  };
}

export function getPool() {
  if (!poolPromise) {
    const pool = new sql.ConnectionPool(getConfig());
    poolPromise = pool.connect().catch((error) => {
      poolPromise = undefined;
      throw error;
    });
  }
  return poolPromise;
}

export async function connectDatabase() {
  const pool = await getPool();
  const result = await pool.request().query(
    'SELECT DB_NAME() AS databaseName, SUSER_SNAME() AS loginName'
  );
  const { databaseName, loginName } = result.recordset[0];
  console.log(`Connected to SQL Server database "${databaseName}" as "${loginName}".`);
}

export async function disconnectDatabase() {
  if (!poolPromise) return;
  const pool = await poolPromise;
  await pool.close();
  poolPromise = undefined;
}

export { sql };
