import { Router, Response } from 'express';
import { db } from '../../data/store.js';
import { authenticate, AuthenticatedRequest } from '../auth/auth.middleware.js';
import { authorize } from '../auth/rbac.middleware.js';
import { AuditService } from '../audit/audit.service.js';
import { config } from '../../config/index.js';

const router = Router();

// GET /api/v1/settings
router.get('/', authenticate, (_req: AuthenticatedRequest, res: Response) => {
  return res.json({
    success: true,
    data: {
      settings: db.settings,
      runtimeConfig: {
        paymentProviderMode: config.paymentProviderMode,
        phonepeEnvironment: config.phonepe.environment,
        phonepeMerchantId: config.phonepe.merchantId,
        razorpayKeyIdMasked: config.razorpay.keyId ? config.razorpay.keyId.substring(0, 8) + '...' : 'Not Set',
        iotMode: config.iot.mode,
        offlineTimeoutSeconds: config.iot.offlineTimeoutSeconds,
        lowStockThreshold: config.iot.lowStockThreshold,
      },
    },
  });
});

// PUT /api/v1/settings
router.put('/', authenticate, authorize(['SUPER_ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const { offlineTimeoutSeconds, lowStockThreshold, paymentProviderMode } = req.body;

  if (offlineTimeoutSeconds !== undefined) {
    const sec = parseInt(offlineTimeoutSeconds, 10);
    if (!isNaN(sec) && sec >= 30) {
      config.iot.offlineTimeoutSeconds = sec;
      const s = db.settings.find((x) => x.key === 'OFFLINE_TIMEOUT_SECONDS');
      if (s) {
        s.value = sec.toString();
        s.updatedAt = new Date().toISOString();
      }
    }
  }

  if (lowStockThreshold !== undefined) {
    const thresh = parseInt(lowStockThreshold, 10);
    if (!isNaN(thresh) && thresh > 0) {
      config.iot.lowStockThreshold = thresh;
      const s = db.settings.find((x) => x.key === 'LOW_STOCK_THRESHOLD_DEFAULT');
      if (s) {
        s.value = thresh.toString();
        s.updatedAt = new Date().toISOString();
      }
    }
  }

  if (paymentProviderMode && (paymentProviderMode === 'mock' || paymentProviderMode === 'production')) {
    config.paymentProviderMode = paymentProviderMode;
    const s = db.settings.find((x) => x.key === 'PAYMENT_PROVIDER_MODE');
    if (s) {
      s.value = paymentProviderMode;
      s.updatedAt = new Date().toISOString();
    }
  }

  AuditService.record({
    userId: req.user?.id,
    action: 'SETTINGS_UPDATED',
    entity: 'SystemSetting',
    newValues: req.body,
  });

  return res.json({
    success: true,
    message: 'System settings updated successfully',
    data: {
      offlineTimeoutSeconds: config.iot.offlineTimeoutSeconds,
      lowStockThreshold: config.iot.lowStockThreshold,
      paymentProviderMode: config.paymentProviderMode,
    },
  });
});

export default router;
