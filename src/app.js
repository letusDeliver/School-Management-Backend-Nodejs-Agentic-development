import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import pinoHttp from 'pino-http';

import { logger } from './config/logger.js';
import { corsOptions } from './config/cors.js';
import { checkDatabaseHealth } from './config/database.js';
import { requestId } from './middlewares/request-id.middleware.js';
import { notFoundHandler } from './middlewares/not-found.middleware.js';
import { errorHandler } from './middlewares/error.middleware.js';

// Reasonable ceiling for typical JSON payloads. Endpoints that need to accept
// large uploads should not send them as base64 JSON in the first place —
// they should use multipart/binary uploads, which this limit does not apply to.
const JSON_BODY_LIMIT = '1mb';

export function createApp() {
  const app = express();

  // Express sits behind a reverse proxy/load balancer in production; this
  // makes req.ip and req.secure reflect the original client via X-Forwarded-*.
  app.set('trust proxy', true);
  app.disable('x-powered-by');

  app.use(requestId);
  app.use(helmet());
  app.use(cors(corsOptions));
  app.use(
    pinoHttp({
      logger,
      genReqId: (req) => req.id,
      customLogLevel: (_req, res, err) => {
        if (err || res.statusCode >= 500) return 'error';
        if (res.statusCode >= 400) return 'warn';
        return 'info';
      },
    }),
  );
  app.use(express.json({ limit: JSON_BODY_LIMIT }));
  app.use(express.urlencoded({ extended: true, limit: JSON_BODY_LIMIT }));

  // Infrastructure-level endpoints only — see docs/architecture.md for why
  // these exist without a broader API surface behind them yet.
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  app.get('/ready', async (req, res) => {
    const databaseHealthy = await checkDatabaseHealth();
    if (!databaseHealthy) {
      return res.status(503).json({ status: 'unavailable', dependencies: { database: 'down' } });
    }
    return res.status(200).json({ status: 'ready', dependencies: { database: 'up' } });
  });

  // Future feature modules will register their routers here, e.g.:
  //   app.use('/api/v1/students', studentsRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
