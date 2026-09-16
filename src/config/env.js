import { z } from 'zod';
import 'dotenv/config';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),

  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  CORS_ORIGIN: z.string().default(''),

  CLOUDINARY_CLOUD_NAME: z.string().optional().default(''),
  CLOUDINARY_API_KEY: z.string().optional().default(''),
  CLOUDINARY_API_SECRET: z.string().optional().default(''),

  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
});

function loadEnv() {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    console.error(`Invalid environment configuration:\n${issues}`);
    process.exit(1);
  }

  return parsed.data;
}

const parsedEnv = loadEnv();

export const env = {
  nodeEnv: parsedEnv.NODE_ENV,
  isProduction: parsedEnv.NODE_ENV === 'production',
  isDevelopment: parsedEnv.NODE_ENV === 'development',
  isTest: parsedEnv.NODE_ENV === 'test',
  port: parsedEnv.PORT,

  databaseUrl: parsedEnv.DATABASE_URL,

  jwt: {
    accessSecret: parsedEnv.JWT_ACCESS_SECRET,
    accessExpiresIn: parsedEnv.JWT_ACCESS_EXPIRES_IN,
    refreshSecret: parsedEnv.JWT_REFRESH_SECRET,
    refreshExpiresIn: parsedEnv.JWT_REFRESH_EXPIRES_IN,
  },

  corsOrigins: parsedEnv.CORS_ORIGIN.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),

  cloudinary: {
    cloudName: parsedEnv.CLOUDINARY_CLOUD_NAME,
    apiKey: parsedEnv.CLOUDINARY_API_KEY,
    apiSecret: parsedEnv.CLOUDINARY_API_SECRET,
    isConfigured: Boolean(
      parsedEnv.CLOUDINARY_CLOUD_NAME &&
      parsedEnv.CLOUDINARY_API_KEY &&
      parsedEnv.CLOUDINARY_API_SECRET,
    ),
  },

  logLevel: parsedEnv.LOG_LEVEL,
};
