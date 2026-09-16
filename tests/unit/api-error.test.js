import { describe, it, expect } from 'vitest';
import { ApiError } from '../../src/utils/api-error.js';

describe('ApiError', () => {
  it('builds a not-found error with the expected shape', () => {
    const error = ApiError.notFound('Thing missing');

    expect(error).toBeInstanceOf(Error);
    expect(error.statusCode).toBe(404);
    expect(error.code).toBe('NOT_FOUND');
    expect(error.message).toBe('Thing missing');
    expect(error.isOperational).toBe(true);
  });

  it('attaches validation details when provided', () => {
    const error = ApiError.validation('Invalid payload', {
      details: [{ path: 'email', message: 'Required' }],
    });

    expect(error.statusCode).toBe(422);
    expect(error.details).toEqual([{ path: 'email', message: 'Required' }]);
  });
});
