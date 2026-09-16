import { HTTP_STATUS } from '../constants/index.js';

/**
 * Represents an expected, operational error (bad input, missing resource,
 * auth failure, ...) as opposed to a programming error/bug. Only errors of
 * this type are considered safe to describe to API clients; anything else
 * is treated as an unexpected 500 by the global error handler.
 */
export class ApiError extends Error {
  constructor(statusCode, message, { code, details } = {}) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code ?? 'ERROR';
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = 'Bad request', options) {
    return new ApiError(HTTP_STATUS.BAD_REQUEST, message, { code: 'BAD_REQUEST', ...options });
  }

  static unauthorized(message = 'Unauthorized', options) {
    return new ApiError(HTTP_STATUS.UNAUTHORIZED, message, { code: 'UNAUTHORIZED', ...options });
  }

  static forbidden(message = 'Forbidden', options) {
    return new ApiError(HTTP_STATUS.FORBIDDEN, message, { code: 'FORBIDDEN', ...options });
  }

  static notFound(message = 'Resource not found', options) {
    return new ApiError(HTTP_STATUS.NOT_FOUND, message, { code: 'NOT_FOUND', ...options });
  }

  static conflict(message = 'Conflict', options) {
    return new ApiError(HTTP_STATUS.CONFLICT, message, { code: 'CONFLICT', ...options });
  }

  static validation(message = 'Validation failed', options) {
    return new ApiError(HTTP_STATUS.UNPROCESSABLE_ENTITY, message, {
      code: 'VALIDATION_ERROR',
      ...options,
    });
  }

  static tooManyRequests(message = 'Too many requests', options) {
    return new ApiError(HTTP_STATUS.TOO_MANY_REQUESTS, message, {
      code: 'TOO_MANY_REQUESTS',
      ...options,
    });
  }

  static internal(message = 'Internal server error', options) {
    return new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, message, {
      code: 'INTERNAL_ERROR',
      ...options,
    });
  }
}
