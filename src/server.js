import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';

const SHUTDOWN_TIMEOUT_MS = 10_000;

async function main() {
  await connectDatabase();

  const app = createApp();
  const server = app.listen(env.port, () => {
    logger.info(`Server listening on port ${env.port} [${env.nodeEnv}]`);
  });

  let isShuttingDown = false;

  async function shutdown(signal) {
    if (isShuttingDown) return;
    isShuttingDown = true;

    logger.info(`Received ${signal}, starting graceful shutdown`);

    const forceExitTimer = setTimeout(() => {
      logger.error('Graceful shutdown timed out, forcing exit');
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS);
    forceExitTimer.unref();

    server.close(async (err) => {
      if (err) {
        logger.error({ err }, 'Error while closing HTTP server');
      } else {
        logger.info('HTTP server closed');
      }

      await disconnectDatabase();
      clearTimeout(forceExitTimer);
      process.exit(err ? 1 : 0);
    });
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('uncaughtException', (err) => {
    logger.fatal({ err }, 'Uncaught exception — shutting down');
    shutdown('uncaughtException');
  });

  process.on('unhandledRejection', (reason) => {
    logger.fatal({ err: reason }, 'Unhandled promise rejection — shutting down');
    shutdown('unhandledRejection');
  });
}

main().catch((err) => {
  logger.fatal({ err }, 'Fatal error during startup');
  process.exit(1);
});
