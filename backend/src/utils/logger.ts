import pino from 'pino';
import { config } from '../config/index.js';

export const logger = pino({
  level: config.nodeEnv === 'production' ? 'info' : 'debug',
  transport: config.nodeEnv !== 'production'
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
  redact: {
    paths: [
      'password',
      'passwordHash',
      'token',
      'jwt',
      'authorization',
      'clientSecret',
      'saltKey',
      'keySecret',
      'webhookSecret',
      'simNumber',
      'imei',
      'deviceTokenHash'
    ],
    censor: '[REDACTED]',
  },
});
