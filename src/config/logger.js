import pino from 'pino';
import { env } from './env.js';

const redactPaths = [
  'req.headers.authorization',
  'req.headers.cookie',
  'req.body.password',
  'req.body.currentPassword',
  'req.body.newPassword',
  'req.body.token',
  'req.body.refreshToken',
  '*.password',
  '*.accessToken',
  '*.refreshToken',
  '*.secret',
  '*.apiKey',
  '*.apiSecret',
];

export const logger = pino({
  level: env.logLevel,
  redact: {
    paths: redactPaths,
    censor: '[REDACTED]',
  },
  transport: env.isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
  base: env.isProduction ? undefined : { pid: process.pid },
});
