import { createApp } from './app.js';
import { env } from './config/env.js';
import { ensureFirstAdmin, firstAdminNotice, pool } from '@asthiwar/database';
import { flushAnonymousAuditWindow } from './middleware/errorHandler.js';
import { logAuditEvent } from './services/audit.service.js';
import { loggableError } from './services/db-errors.js';

/**
 * An install with no admin gets one on its first start, instead of only when
 * someone runs the seed with ADMIN_SEED_PASSWORD set. ensureFirstAdmin decides
 * the email and password, and prints nothing sensitive unless it generated one.
 */
async function bootstrapFirstAdmin(): Promise<void> {
  try {
    const result = await ensureFirstAdmin({
      production: env.NODE_ENV === 'production',
      email: env.ADMIN_SEED_EMAIL,
      password: env.ADMIN_SEED_PASSWORD,
    });
    if (!result.created) return;

    console.log(firstAdminNotice(result));
    await logAuditEvent({
      eventType: 'INFO',
      action: 'FIRST_ADMIN_CREATED',
      severity: 'HIGH',
      actorType: 'SYSTEM',
      metadata: { passwordSource: result.passwordSource },
    });
  } catch (err) {
    // An unmigrated database has no admin table. The API cannot serve much then
    // either, but it should start and say why rather than crash-loop.
    console.error('[bootstrap] Could not create the first admin account:', loggableError(err));
  }
}

await bootstrapFirstAdmin();

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
      // Write the last minute's withheld-error summary before the pool goes away.
      await flushAnonymousAuditWindow();
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
