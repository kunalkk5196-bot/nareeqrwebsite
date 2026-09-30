import crypto from 'crypto';
import { db } from '../../data/store.js';
import { phonePeService } from './providers/phonepe.service.js';
import { razorpayService } from './providers/razorpay.service.js';
import { IoTService } from '../iot/iot.service.js';
import { AuditService } from '../audit/audit.service.js';
import { logger } from '../../utils/logger.js';

export interface ProcessWebhookInput {
  gateway: 'PHONEPE' | 'RAZORPAY';
  rawBody: string;
  signature?: string;
  idempotencyHeader?: string;
}

export class PaymentService {
  /**
   * Securely process an incoming payment webhook with signature check and idempotency
   */
  static async processWebhook(input: ProcessWebhookInput) {
    const { gateway, rawBody, signature, idempotencyHeader } = input;

    // 1. Calculate idempotency hash of payload if no header provided
    const idempotencyKey =
      idempotencyHeader ||
      crypto.createHash('sha256').update(`${gateway}:${rawBody}`).digest('hex');

    // 2. Prevent duplicate processing (Idempotency check)
    const existingWebhook = db.webhooks.find((w) => w.idempotencyKey === idempotencyKey);
    if (existingWebhook) {
      logger.warn({ idempotencyKey, gateway }, 'Duplicate webhook event received; returning idempotent cached response');
      return {
        isDuplicate: true,
        success: true,
        message: 'Webhook already processed (Idempotent replay)',
        webhookId: existingWebhook.id,
      };
    }

    // 3. Verify signature using corresponding provider service
    const providerService = gateway === 'PHONEPE' ? phonePeService : razorpayService;
    const verification = await providerService.verifyWebhook(rawBody, signature || '');

    if (!verification.isValidSignature) {
      logger.error({ gateway, signature }, 'Webhook signature verification failed');
      const failedWebhook = {
        id: `whk-${Date.now()}`,
        gateway,
        eventType: 'WEBHOOK_RECEIVED',
        payload: rawBody,
        signature,
        isValid: false,
        idempotencyKey,
        processedAt: new Date().toISOString(),
        errorMessage: 'INVALID_SIGNATURE',
        createdAt: new Date().toISOString(),
      };
      db.webhooks.unshift(failedWebhook);
      throw new Error('WEBHOOK_SIGNATURE_INVALID');
    }

    // 4. Resolve Machine from QR Identifier mapping
    // Lookup QR mapping table:
    let resolvedMachine = null;
    if (verification.qrIdentifier) {
      const qrRecord = db.qrIdentifiers.find(
        (q) =>
          q.gateway === gateway &&
          q.isActive &&
          q.identifier.toUpperCase() === verification.qrIdentifier?.toUpperCase()
      );
      if (qrRecord) {
        resolvedMachine = db.machines.find((m) => m.id === qrRecord.machineId);
      }
    }

    // Fallback: search machineId or notes
    if (!resolvedMachine && verification.referenceId) {
      const qrRecord = db.qrIdentifiers.find(
        (q) =>
          q.gateway === gateway &&
          q.isActive &&
          q.identifier.toUpperCase().includes(verification.referenceId!.toUpperCase())
      );
      if (qrRecord) {
        resolvedMachine = db.machines.find((m) => m.id === qrRecord.machineId);
      }
    }

    // Fallback 2: machineId directly mentioned in mock/metadata
    if (!resolvedMachine) {
      try {
        const parsed = JSON.parse(rawBody);
        const candidateId = parsed.machineId || parsed.machine_id;
        if (candidateId) {
          resolvedMachine = db.machines.find(
            (m) => m.machineId.toUpperCase() === candidateId.toUpperCase() || m.id === candidateId
          );
        }
      } catch (e) {}
    }

    if (!resolvedMachine) {
      logger.error(
        { gateway, qrIdentifier: verification.qrIdentifier, ref: verification.referenceId },
        'Cannot resolve vending machine for payment identifier'
      );
      // Still log webhook for manual reconciliation
      db.webhooks.unshift({
        id: `whk-${Date.now()}`,
        gateway,
        eventType: 'PAYMENT_UNRECONCILED_MACHINE',
        payload: rawBody,
        signature,
        isValid: true,
        idempotencyKey,
        processedAt: new Date().toISOString(),
        errorMessage: 'UNRESOLVED_MACHINE_IDENTIFIER',
        createdAt: new Date().toISOString(),
      });
      throw new Error('MACHINE_RESOLUTION_FAILED');
    }

    const nowIso = new Date().toISOString();
    const txnId =
      verification.transactionId ||
      `TXN-${nowIso.slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

    // 5. Create or update payment record
    let payment = db.payments.find(
      (p) => p.transactionId === txnId || (verification.providerTxnId && p.providerTxnId === verification.providerTxnId)
    );

    if (!payment) {
      payment = {
        id: `pay-${Date.now()}`,
        transactionId: txnId,
        machineId: resolvedMachine.id,
        gateway,
        amount: verification.amount || 10.0,
        currency: verification.currency || 'INR',
        status: verification.status,
        providerTxnId: verification.providerTxnId,
        productId: 'prod-001',
        quantity: 1,
        failureReason: verification.failureReason,
        referenceId: verification.referenceId,
        webhookStatus: 'VERIFIED',
        verifiedAt: verification.status === 'SUCCESS' ? nowIso : undefined,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      db.payments.unshift(payment);
    } else {
      payment.status = verification.status;
      payment.providerTxnId = verification.providerTxnId || payment.providerTxnId;
      payment.failureReason = verification.failureReason;
      payment.webhookStatus = 'VERIFIED';
      payment.verifiedAt = verification.status === 'SUCCESS' ? nowIso : payment.verifiedAt;
      payment.updatedAt = nowIso;
    }

    // 6. Record verified webhook audit trail
    const savedWebhook = {
      id: `whk-${Date.now()}`,
      paymentId: payment.id,
      gateway,
      eventType: `PAYMENT_${verification.status}`,
      payload: rawBody,
      signature,
      isValid: true,
      idempotencyKey,
      processedAt: nowIso,
      createdAt: nowIso,
    };
    db.webhooks.unshift(savedWebhook);

    // 7. If payment SUCCESS -> Trigger physical dispensing!
    let dispenseTransaction = null;
    if (verification.status === 'SUCCESS') {
      logger.info(
        { machineId: resolvedMachine.machineId, paymentId: payment.id, amount: payment.amount },
        'Payment verified successful. Triggering physical IoT dispense command...'
      );
      dispenseTransaction = IoTService.triggerDispense(resolvedMachine.id, payment.id, 1, 'prod-001');
    }

    AuditService.record({
      action: `PAYMENT_WEBHOOK_${verification.status}`,
      entity: 'Payment',
      entityId: payment.id,
      metadata: {
        gateway,
        amount: payment.amount,
        machineId: resolvedMachine.machineId,
        dispenseTriggered: !!dispenseTransaction,
      },
    });

    return {
      success: true,
      paymentId: payment.id,
      transactionId: payment.transactionId,
      machineId: resolvedMachine.machineId,
      status: payment.status,
      dispenseTriggered: !!dispenseTransaction,
      dispenseId: dispenseTransaction?.dispenseId,
    };
  }
}
