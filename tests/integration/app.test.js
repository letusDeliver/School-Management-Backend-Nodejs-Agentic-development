import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';

const app = createApp();

describe('app bootstrap', () => {
  it('GET /health reports the process is alive', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  it('returns a consistent JSON error shape for unknown routes', async () => {
    const response = await request(app).get('/this-route-does-not-exist');

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });
});
