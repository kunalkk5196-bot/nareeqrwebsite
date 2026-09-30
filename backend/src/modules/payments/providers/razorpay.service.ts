import crypto from 'crypto';
import { IPaymentGateway, PaymentVerificationResult, WebhookVerificationResult } from './payment-gateway.interface.js';
import { config } from '../../../config/index.js';
import { logger } from '../../../utils/logger.js';

export class RazorpayService implements IPaymentGateway {
  public name = 'RAZORPAY' as const;

  /**
   * Verify official Razorpay webhook signature
   * Header: X-Razorpay-Signature: HMAC-SHA256 of raw request body with RAZORPAY_WEBHOOK_SECRET
   */
  async verifyWebhook(rawBody: string, signature: string): Promise<WebhookVerificationResult> {
    if (config.paymentProviderMode === 'mock') {
      logger.info('Razorpay running in MOCK mode. Processing mock webhook payload.');
      try {
        const parsed = JSON.parse(rawBody);
        return {
          isValidSignature: true,
          transactionId: parsed.transactionId || `TXN-RP-${Date.now()}`,
          providerTxnId: parsed.providerTxnId || `pay_${Date.now()}`,
          amount: parsed.amount || 10.0,
          currency: 'INR',
          status: parsed.status || 'SUCCESS',
          failureReason: parsed.failureReason,
          referenceId: parsed.referenceId || parsed.orderId,
          qrIdentifier: parsed.qrIdentifier,
          rawEvent: parsed,
        };
      } catch (err) {
        return { isValidSignature: false, status: 'UNKNOWN' };
      }
    }

    try {
      const secret = config.razorpay.webhookSecret;
      if (!secret) {
        logger.warn('Razorpay webhook secret not configured; signature check bypassed in non-mock environment');
        return { isValidSignature: false, status: 'UNKNOWN' };
      }

      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(rawBody)
        .digest('hex');

      const isMatch = crypto.timingSafeEqual(Buffer.from(signature || ''), Buffer.from(expectedSignature));
      if (!isMatch) {
        logger.warn('Razorpay webhook HMAC signature mismatch');
        return { isValidSignature: false, status: 'UNKNOWN' };
      }

      const parsed = JSON.parse(rawBody);
      const event = parsed.event; // 'payment.captured', 'payment.failed', 'order.paid'
      const paymentEntity = parsed.payload?.payment?.entity;

      let status: 'SUCCESS' | 'FAILED' | 'PENDING' | 'UNKNOWN' = 'PENDING';
      if (event === 'payment.captured' || event === 'order.paid') {
        status = 'SUCCESS';
      } else if (event === 'payment.failed') {
        status = 'FAILED';
      }

      const amount = paymentEntity?.amount ? paymentEntity.amount / 100 : 10.0; // Razorpay amounts are in paise
      const qrId = paymentEntity?.notes?.qr_identifier || paymentEntity?.notes?.machine_id;

      return {
        isValidSignature: true,
        transactionId: paymentEntity?.notes?.transaction_id || `TXN-RP-${paymentEntity?.id}`,
        providerTxnId: paymentEntity?.id,
        amount,
        currency: paymentEntity?.currency || 'INR',
        status,
        failureReason: paymentEntity?.error_description || paymentEntity?.error_reason,
        referenceId: paymentEntity?.order_id,
        qrIdentifier: qrId,
        rawEvent: parsed,
      };
    } catch (error: any) {
      logger.error({ err: error.message }, 'Error verifying Razorpay webhook');
      return { isValidSignature: false, status: 'UNKNOWN' };
    }
  }

  /**
   * Check payment status against official Razorpay REST API
   */
  async checkPaymentStatus(paymentId: string): Promise<PaymentVerificationResult> {
    if (config.paymentProviderMode === 'mock') {
      return {
        isValid: true,
        providerTxnId: paymentId,
        amount: 10.0,
        status: 'SUCCESS',
        referenceId: `order_${Date.now()}`,
      };
    }

    try {
      const { keyId, keySecret, baseUrl } = config.razorpay;
      const authHeader = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64');

      const response = await fetch(`${baseUrl}/payments/${paymentId}`, {
        method: 'GET',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json',
        },
      });

      const data: any = await response.json();
      const isSuccess = data.status === 'captured';

      return {
        isValid: response.ok,
        providerTxnId: data.id,
        amount: data.amount ? data.amount / 100 : undefined,
        status: isSuccess ? 'SUCCESS' : data.status === 'failed' ? 'FAILED' : 'PENDING',
        failureReason: data.error_description,
        referenceId: data.order_id,
        metadata: data.notes,
        rawResponse: data,
      };
    } catch (error: any) {
      logger.error({ err: error.message, paymentId }, 'Failed checking Razorpay payment status via API');
      return {
        isValid: false,
        status: 'UNKNOWN',
        failureReason: error.message,
      };
    }
  }
}

export const razorpayService = new RazorpayService();
