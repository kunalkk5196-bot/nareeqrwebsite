export interface PaymentVerificationResult {
  isValid: boolean;
  providerTxnId?: string;
  amount?: number;
  status: 'SUCCESS' | 'FAILED' | 'PENDING' | 'CANCELLED' | 'UNKNOWN';
  failureReason?: string;
  referenceId?: string;
  metadata?: Record<string, any>;
  rawResponse?: any;
}

export interface WebhookVerificationResult {
  isValidSignature: boolean;
  transactionId?: string;
  providerTxnId?: string;
  amount?: number;
  currency?: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING' | 'UNKNOWN';
  failureReason?: string;
  referenceId?: string;
  qrIdentifier?: string; // Existing QR identifier (e.g. PH-VM-PUN-0001)
  rawEvent?: any;
}

export interface IPaymentGateway {
  name: 'PHONEPE' | 'RAZORPAY';
  verifyWebhook(rawBody: string, signature: string): Promise<WebhookVerificationResult>;
  checkPaymentStatus(transactionId: string): Promise<PaymentVerificationResult>;
}
