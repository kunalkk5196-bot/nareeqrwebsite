import crypto from 'crypto';
import { IPaymentGateway, PaymentVerificationResult, WebhookVerificationResult } from './payment-gateway.interface.js';
import { config } from '../../../config/index.js';
import { logger } from '../../../utils/logger.js';

export class PhonePeService implements IPaymentGateway {
  public name = 'PHONEPE' as const;

  /**
   * Verify official PhonePe Webhook callback
   * PhonePe sends base64 payload and X-VERIFY header: SHA256(base64Payload + saltKey) + "###" + saltIndex
   */
  async verifyWebhook(rawBody: string, xVerifyHeader: string): Promise<WebhookVerificationResult> {
    if (config.paymentProviderMode === 'mock') {
      logger.info('PhonePe running in MOCK mode. Processing mock webhook payload.');
      try {
        const parsed = JSON.parse(rawBody);
        return {
          isValidSignature: true,
          transactionId: parsed.transactionId || `TXN-PH-${Date.now()}`,
          providerTxnId: parsed.providerTxnId || `T${Date.now()}`,
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
      const { saltKey, saltIndex } = config.phonepe;
      if (!saltKey) {
        logger.warn('PhonePe salt key not configured; cannot verify signature.');
        return { isValidSignature: false, status: 'UNKNOWN' };
      }

      const [hash, index] = (xVerifyHeader || '').split('###');
      if (!hash || index !== saltIndex) {
        logger.warn({ expectedIndex: saltIndex, receivedIndex: index }, 'PhonePe X-VERIFY salt index mismatch');
        return { isValidSignature: false, status: 'UNKNOWN' };
      }

      const expectedHash = crypto
        .createHash('sha256')
        .update(rawBody + saltKey)
        .digest('hex');

      const isValid = crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(expectedHash));
      if (!isValid) {
        logger.warn('PhonePe X-VERIFY checksum signature mismatch');
        return { isValidSignature: false, status: 'UNKNOWN' };
      }

      // Parse decoded PhonePe JSON payload
      const parsed = JSON.parse(rawBody);
      const data = parsed.response ? JSON.parse(Buffer.from(parsed.response, 'base64').toString('utf-8')) : parsed;

      const code = data.code;
      const status = code === 'PAYMENT_SUCCESS' ? 'SUCCESS' : code === 'PAYMENT_ERROR' ? 'FAILED' : 'PENDING';
      const amount = data.data?.amount ? data.data.amount / 100 : 10.0; // PhonePe uses paise

      return {
        isValidSignature: true,
        transactionId: data.data?.merchantTransactionId,
        providerTxnId: data.data?.transactionId,
        amount,
        currency: 'INR',
        status,
        failureReason: status === 'FAILED' ? data.message : undefined,
        referenceId: data.data?.merchantOrderId,
        qrIdentifier: data.data?.merchantUserId || data.data?.instrumentResponse?.qrId,
        rawEvent: data,
      };
    } catch (error: any) {
      logger.error({ err: error.message }, 'Error verifying PhonePe webhook');
      return { isValidSignature: false, status: 'UNKNOWN' };
    }
  }

  /**
   * Check payment status against official PhonePe API
   */
  async checkPaymentStatus(transactionId: string): Promise<PaymentVerificationResult> {
    if (config.paymentProviderMode === 'mock') {
      return {
        isValid: true,
        providerTxnId: `T${Date.now()}`,
        amount: 10.0,
        status: 'SUCCESS',
        referenceId: `REF-${transactionId}`,
      };
    }

    try {
      const { merchantId, saltKey, saltIndex, baseUrl } = config.phonepe;
      const path = `/pg/v1/status/${merchantId}/${transactionId}`;
      const stringToHash = path + saltKey;
      const sha256 = crypto.createHash('sha256').update(stringToHash).digest('hex');
      const xVerify = `${sha256}###${saltIndex}`;

      const response = await fetch(`${baseUrl}${path}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-VERIFY': xVerify,
          'X-MERCHANT-ID': merchantId,
        },
      });

      const json: any = await response.json();
      const isSuccess = json.success && json.code === 'PAYMENT_SUCCESS';

      return {
        isValid: json.success === true,
        providerTxnId: json.data?.transactionId,
        amount: json.data?.amount ? json.data.amount / 100 : undefined,
        status: isSuccess ? 'SUCCESS' : json.code === 'PAYMENT_PENDING' ? 'PENDING' : 'FAILED',
        failureReason: !isSuccess ? json.message : undefined,
        referenceId: json.data?.merchantOrderId,
        rawResponse: json,
      };
    } catch (error: any) {
      logger.error({ err: error.message, transactionId }, 'Failed checking PhonePe status via API');
      return {
        isValid: false,
        status: 'UNKNOWN',
        failureReason: error.message,
      };
    }
  }
}

export const phonePeService = new PhonePeService();
