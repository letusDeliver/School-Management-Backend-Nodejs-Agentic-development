import { env } from './env.js';
import { ApiError } from '../utils/api-error.js';

// An empty allowlist (e.g. unset CORS_ORIGIN in production) intentionally
// rejects every cross-origin request rather than falling back to "allow all".
export const corsOptions = {
  origin(origin, callback) {
    // Same-origin requests, curl, server-to-server calls, etc. have no
    // Origin header at all and are always allowed.
    if (!origin) {
      return callback(null, true);
    }

    if (env.corsOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(ApiError.forbidden(`Origin ${origin} is not allowed by CORS policy`));
  },
  credentials: true,
};
