import { createApp } from './app.js';
import { env } from './config/env.js';
import { pool } from '@asthiwar/database';

const app = createApp();

const server = app.listen(env.PORT, () => {
  console.log(`
🚀 ASTHIWAR Backend API Server running!
--------------------------------------------------
📡 Port:         ${env.PORT}
🌍 Environment:  ${env.NODE_ENV}
🩺 Health Check: http://localhost:${env.PORT}/api/v1/health
--------------------------------------------------
`);
});

// Graceful Shutdown
async function shutdown(signal: string) {
  console.log(`\n🛑 Received ${signal}. Gracefully shutting down...`);
  server.close(async () => {
    console.log('🔒 HTTP server closed.');
    try {
      await pool.end();
      console.log('🔌 Database pool closed.');
      process.exit(0);
    } catch (err) {
      console.error('Error during database pool shutdown:', err);
      process.exit(1);
    }
  });

  // Force shutdown if takes too long
  setTimeout(() => {
    console.error('⚠️ Forcefully shutting down after timeout.');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
