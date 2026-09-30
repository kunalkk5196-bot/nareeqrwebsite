import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',

  database: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/naree_vending?schema=public',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'naree_super_secure_jwt_secret_key_2026_change_in_production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  paymentProviderMode: (process.env.PAYMENT_PROVIDER_MODE || 'mock') as 'mock' | 'production',

  phonepe: {
    merchantId: process.env.PHONEPE_MERCHANT_ID || 'MERCHANT_NAREE_001',
    clientId: process.env.PHONEPE_CLIENT_ID || '',
    clientSecret: process.env.PHONEPE_CLIENT_SECRET || '',
    saltKey: process.env.PHONEPE_SALT_KEY || '',
    saltIndex: process.env.PHONEPE_SALT_INDEX || '1',
    environment: process.env.PHONEPE_ENVIRONMENT || 'UAT',
    webhookSecret: process.env.PHONEPE_WEBHOOK_SECRET || '',
    baseUrl: process.env.PHONEPE_ENVIRONMENT === 'PROD' 
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
    offlineTimeoutSeconds: parseInt(process.env.OFFLINE_TIMEOUT_SECONDS || '300', 10), // default 5 min
    lowStockThreshold: parseInt(process.env.LOW_STOCK_THRESHOLD || '20', 10),
  },
};
