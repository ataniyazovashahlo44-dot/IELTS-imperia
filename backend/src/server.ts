import 'dotenv/config';
import http from 'http';
import app from './app';
import { initSocket } from './socket/socketHandler';
import prisma from './config/database';
import { ENV } from './config/env';

const server = http.createServer(app);
initSocket(server);

async function main() {
  console.log('[Server] Starting startup sequence...');
  try {
    console.log('[DB] Connecting to PostgreSQL...');
    await prisma.$connect();
    console.log('[DB] Connected successfully');

    const HOST = '0.0.0.0';
    server.listen(ENV.PORT, HOST, () => {
      console.log(`[Server] Listening on http://${HOST}:${ENV.PORT}`);
      console.log(`[Server] Public URL expectation: ${process.env.RAILWAY_STATIC_URL || 'Not set'}`);
      console.log(`[Server] Environment: ${ENV.NODE_ENV}`);
    });
  } catch (err) {
    console.error('[Server] Fatal startup error:', err);
    process.exit(1);
  }
}

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  server.close(() => process.exit(0));
});
