import { v2 as cloudinary } from 'cloudinary';
import { env } from './env.js';
import { logger } from './logger.js';

// Configuration only — no upload endpoints or controllers exist yet.
// Cloudinary remains unconfigured (and unused) until credentials are
// provided; this does not block local development.
if (env.cloudinary.isConfigured) {
  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret,
    secure: true,
  });
  logger.info('Cloudinary configured');
} else {
  logger.warn('Cloudinary credentials not provided — media features are unavailable');
}

export { cloudinary };
