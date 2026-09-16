import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

/**
 * JWT foundation for future authentication. No routes/controllers consume
 * this yet. Access and refresh tokens intentionally use separate secrets so
 * one can be rotated/revoked independently of the other. See
 * docs/architecture.md for the broader auth strategy notes.
 */

export function signAccessToken(payload) {
  return jwt.sign(payload, env.jwt.accessSecret, { expiresIn: env.jwt.accessExpiresIn });
}

export function signRefreshToken(payload) {
  return jwt.sign(payload, env.jwt.refreshSecret, { expiresIn: env.jwt.refreshExpiresIn });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.jwt.accessSecret);
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, env.jwt.refreshSecret);
}
