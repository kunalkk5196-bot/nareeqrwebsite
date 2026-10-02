import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), 'backend/.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });


// -------------------------------------------------------
// MOCK_MODE: when true, the backend uses an in-memory
// data store seeded with demo data. No PostgreSQL needed.
// Set MOCK_MODE=false (or remove) for production.
// -------------------------------------------------------
const rawMockMode = process.env.MOCK_MODE;
const isMockMode = rawMockMode === undefined ? true : rawMockMode === 'true';

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',

  // MOCK_MODE controls whether the app uses PostgreSQL or in-memory store.
  // Production MUST set MOCK_MODE=false and supply a valid DATABASE_URL.
  mockMode: isMockMode,

  database: {
    url: process.env.DATABASE_URL || '',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'naree_super_secure_jwt_secret_key_2026_CHANGE_IN_PRODUCTION',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  paymentProviderMode: (process.env.PAYMENT_PROVIDER_MODE || 'mock') as 'mock' | 'production',

  phonepe: {
    merchantId: process.env.PHONEPE_MERCHANT_ID || '',
    clientId: process.env.PHONEPE_CLIENT_ID || '',
    clientSecret: process.env.PHONEPE_CLIENT_SECRET || '',
    saltKey: process.env.PHONEPE_SALT_KEY || '',
    saltIndex: process.env.PHONEPE_SALT_INDEX || '1',
    environment: process.env.PHONEPE_ENVIRONMENT || 'UAT',
    webhookSecret: process.env.PHONEPE_WEBHOOK_SECRET || '',
    baseUrl:
      process.env.PHONEPE_ENVIRONMENT === 'PROD'
        ? 'https://api.phonepe.com/apis/hermes'
        : 'https://api-preprod.phonepe.com/apis/pg-sandbox',
  },

  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || '',
    keySecret: process.env.RAZORPAY_KEY_SECRET || '',
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
    baseUrl: 'https://api.razorpay.com/v1',
  },

  iot: {
    mode: (process.env.IOT_MODE || 'mock') as 'mock' | 'production',
    mqttBrokerUrl: process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883',
    mqttUsername: process.env.MQTT_USERNAME || '',
    mqttPassword: process.env.MQTT_PASSWORD || '',
    offlineTimeoutSeconds: parseInt(process.env.OFFLINE_TIMEOUT_SECONDS || '300', 10),
    lowStockThreshold: parseInt(process.env.LOW_STOCK_THRESHOLD || '20', 10),
  },
};

// Startup guard — fail fast if misconfigured
if (!config.mockMode && !config.database.url) {
  console.error(
    '\n[NAREE CONFIG ERROR] MOCK_MODE=false but DATABASE_URL is not set.\n' +
    'Either set MOCK_MODE=true for development or provide a valid DATABASE_URL.\n'
  );
  process.exit(1);
}
