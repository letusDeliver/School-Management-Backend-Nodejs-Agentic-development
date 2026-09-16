import { ZodError } from 'zod';
import { ApiError } from '../utils/api-error.js';
import { HTTP_STATUS } from '../constants/index.js';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

/**
 * Normalizes any thrown error into an ApiError so the rest of the pipeline
 * only ever deals with one shape.
 */
function normalizeError(err) {
  if (err instanceof ApiError) {
    return err;
  }

  if (err instanceof ZodError) {
    return ApiError.validation('Validation failed', {
      details: err.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    });
  }

  // http-errors instances (e.g. thrown by body-parser on malformed JSON)
  if (typeof err?.status === 'number' || typeof err?.statusCode === 'number') {
    const statusCode = err.status ?? err.statusCode;
    if (statusCode < HTTP_STATUS.INTERNAL_SERVER_ERROR) {
      return new ApiError(statusCode, err.message, { code: 'ERROR' });
    }
  }

  return ApiError.internal();
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const apiError = normalizeError(err);
  const log = req.log ?? logger;

  if (apiError.statusCode >= HTTP_STATUS.INTERNAL_SERVER_ERROR) {
    log.error({ err, requestId: req.id }, 'Unhandled error');
  } else {
    log.warn({ err: apiError.message, requestId: req.id }, 'Request error');
  }

  const body = {
    success: false,
    error: {
      code: apiError.code,
      message:
        apiError.statusCode >= HTTP_STATUS.INTERNAL_SERVER_ERROR && env.isProduction
          ? 'Internal server error'
          : apiError.message,
      ...(apiError.details ? { details: apiError.details } : {}),
    },
  };

  res.status(apiError.statusCode).json(body);
}
