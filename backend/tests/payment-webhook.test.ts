import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/index.js';
import { db } from '../src/data/store.js';

describe('Payment Webhooks & Idempotency Suite', () => {
  it('should process simulated PhonePe webhook and trigger dispense', async () => {
    const uniqueTxn = `TXN-TEST-${Date.now()}`;
    const payload = {
      transactionId: uniqueTxn,
      providerTxnId: `T_TEST_${Date.now()}`,
      amount: 10.0,
      status: 'SUCCESS',
      qrIdentifier: 'PH-VM-PUN-0001',
    };

    const res = await request(app)
      .post('/api/v1/webhooks/phonepe')
      .set('x-idempotency-key', `idem-${uniqueTxn}`)
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.machineId).toBe('VM-PUN-0001');
    expect(res.body.data.dispenseTriggered).toBe(true);

    // Verify payment was recorded
    const payment = db.payments.find((p) => p.transactionId === uniqueTxn);
    expect(payment).toBeDefined();
    expect(payment?.status).toBe('SUCCESS');
  });

  it('should reject or handle duplicate webhook idempotently', async () => {
    const fixedIdemKey = `idem-fixed-duplicate-key-12345`;
    const payload = {
      transactionId: `TXN-DUP-1`,
      providerTxnId: `T_DUP_1`,
      amount: 10.0,
      status: 'SUCCESS',
      qrIdentifier: 'PH-VM-PUN-0001',
    };

    // First call
    const res1 = await request(app)
      .post('/api/v1/webhooks/phonepe')
      .set('x-idempotency-key', fixedIdemKey)
      .send(payload);
    expect(res1.status).toBe(200);

    // Second call with same idempotency key
    const res2 = await request(app)
      .post('/api/v1/webhooks/phonepe')
      .set('x-idempotency-key', fixedIdemKey)
      .send(payload);
    expect(res2.status).toBe(200);
    expect(res2.body.data.isDuplicate).toBe(true);
  });
});
