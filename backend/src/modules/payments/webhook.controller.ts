import { Router, Request, Response } from 'express';
import { PaymentService } from './payment.service.js';
import { logger } from '../../utils/logger.js';

const router = Router();

// 1. PhonePe Webhook Endpoint
router.post('/phonepe', async (req: Request, res: Response) => {
  try {
    const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    const signature = (req.headers['x-verify'] as string) || '';
    const idempotencyHeader = (req.headers['x-idempotency-key'] as string) || undefined;

    const result = await PaymentService.processWebhook({
      gateway: 'PHONEPE',
      rawBody,
      signature,
      idempotencyHeader,
    });

    return res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    logger.error({ err: error.message }, 'PhonePe webhook processing failure');
    const statusCode = error.message === 'WEBHOOK_SIGNATURE_INVALID' ? 401 : 400;
    return res.status(statusCode).json({
      success: false,
      error: { code: error.message, message: 'PhonePe webhook processing failed' },
    });
  }
});

// 2. Razorpay Webhook Endpoint
router.post('/razorpay', async (req: Request, res: Response) => {
  try {
    const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    const signature = (req.headers['x-razorpay-signature'] as string) || '';
    const idempotencyHeader = (req.headers['x-idempotency-key'] as string) || undefined;

    const result = await PaymentService.processWebhook({
      gateway: 'RAZORPAY',
      rawBody,
      signature,
      idempotencyHeader,
    });

    return res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    logger.error({ err: error.message }, 'Razorpay webhook processing failure');
    const statusCode = error.message === 'WEBHOOK_SIGNATURE_INVALID' ? 401 : 400;
    return res.status(statusCode).json({
      success: false,
      error: { code: error.message, message: 'Razorpay webhook processing failed' },
    });
  }
});

export default router;
