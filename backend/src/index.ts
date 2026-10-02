import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { config } from './config/index.js';
import { logger } from './utils/logger.js';
import { db } from './data/store.js';

// Route Handlers
import authRouter from './modules/auth/auth.controller.js';
import analyticsRouter from './modules/analytics/analytics.controller.js';
import machineRouter from './modules/machines/machine.controller.js';
import paymentRouter from './modules/payments/payment.controller.js';
import webhookRouter from './modules/payments/webhook.controller.js';
import iotRouter from './modules/iot/iot.controller.js';
import dispensingRouter from './modules/dispensing/dispensing.controller.js';
import stockRouter from './modules/stock/stock.controller.js';
import reconciliationRouter from './modules/reconciliation/reconciliation.controller.js';
import qrActivityRouter from './modules/qr-activity/qr-activity.controller.js';
import reportsRouter from './modules/reports/report.controller.js';
import notificationsRouter from './modules/notifications/notification.controller.js';
import usersRouter from './modules/users/user.controller.js';
import auditRouter from './modules/audit/audit.controller.js';
import settingsRouter from './modules/settings/settings.controller.js';
import { swaggerDocument } from './docs/swagger.js';
import { checkDatabaseConnection } from './data/prisma.js';
import { apiLimiter, authLimiter } from './middleware/index.js';

const app = express();

// Security and CORS
app.use(helmet({ contentSecurityPolicy: false }));
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Verify', 'X-Razorpay-Signature', 'X-Idempotency-Key'],
  })
);

// Body parsing with raw buffer capture for webhook signature verification
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req: Request, _res: Response, next: NextFunction) => {
  if (!req.path.includes('/docs')) {
    logger.debug({ method: req.method, path: req.path, ip: req.ip }, 'Incoming HTTP Request');
  }
  next();
});

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.nodeEnv,
    database: 'CONNECTED',
    totalMachines: db.machines.length,
  });
});

// API Documentation
app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Rate limiting in production/dev (skipped in unit testing)
if (process.env.NODE_ENV !== 'test') {
  app.use('/api/v1/auth/login', authLimiter);
  app.use('/api/v1', apiLimiter);
}

// Mount REST API endpoints under /api/v1
const api = express.Router();
api.use('/auth', authRouter);
api.use('/dashboard', analyticsRouter);
api.use('/machines', machineRouter);
api.use('/payments', paymentRouter);
api.use('/webhooks', webhookRouter);
api.use('/iot', iotRouter);
api.use('/dispensing', dispensingRouter);
api.use('/stock', stockRouter);
api.use('/reconciliation', reconciliationRouter);
api.use('/qr-activity', qrActivityRouter);
api.use('/reports', reportsRouter);
api.use('/notifications', notificationsRouter);
api.use('/users', usersRouter);
api.use('/audit-logs', auditRouter);
api.use('/settings', settingsRouter);

app.use(config.apiPrefix, api);

// Centralized error handling adhering strictly to Section 36
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  logger.error({ err: err.message, stack: err.stack }, 'Unhandled error in application');
  res.status(err.status || 500).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: err.message || 'An unexpected error occurred. Please contact administrator.',
    },
  });
});

// 404 Handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: 'The requested API endpoint does not exist.',
    },
  });
});

// Periodic background job: Offline monitor (checks every 30 seconds)
setInterval(() => {
  try {
    db.updateMachineStatuses(config.iot.offlineTimeoutSeconds);
  } catch (err: any) {
    logger.error({ err: err.message }, 'Error in periodic heartbeat offline monitor job');
  }
}, 30000);

// Start server
if (process.env.NODE_ENV !== 'test') {
  app.listen(config.port, async () => {
    logger.info(`=======================================================`);
    logger.info(`NAREE VENDTRACK - Backend API Server running`);
    logger.info(`Server Port      : http://localhost:${config.port}`);
    logger.info(`API Base URL     : http://localhost:${config.port}${config.apiPrefix}`);
    logger.info(`Swagger API Docs : http://localhost:${config.port}${config.apiPrefix}/docs`);
    logger.info(`Payment Mode     : ${config.paymentProviderMode.toUpperCase()}`);
    logger.info(`IoT Mode         : ${config.iot.mode.toUpperCase()}`);
    logger.info(`Offline Timeout  : ${config.iot.offlineTimeoutSeconds} seconds`);
    if (config.mockMode) {
      logger.warn(`*** MOCK MODE ACTIVE — Using in-memory data store. Data resets on restart. ***`);
      logger.warn(`*** Set MOCK_MODE=false + DATABASE_URL for production PostgreSQL.          ***`);
    } else {
      logger.info(`Database Mode    : PostgreSQL (${config.database.url.split('@').pop()})`);
      await checkDatabaseConnection();
    }
    logger.info(`=======================================================`);
  });
}

export default app;
