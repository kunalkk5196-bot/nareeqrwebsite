import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/index.js';

describe('Reconciliation & Stock Anomaly Suite', () => {
  let token: string;

  it('login to get token', async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'superadmin@naree.com', password: 'Password@123' });
    token = loginRes.body.data.token;
    expect(token).toBeDefined();
  });

  it('should list reconciliation exceptions including Payment Success with Dispense Failure', async () => {
    const res = await request(app)
      .get('/api/v1/reconciliation')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.summary.totalExceptions).toBeGreaterThan(0);

    const mismatches = res.body.data.paymentDispenseMismatches;
    expect(mismatches.length).toBeGreaterThan(0);
    // pay-006 should be listed because payment succeeded but dispense was jammed
    const jammedCase = mismatches.find((m: any) => m.paymentId === 'pay-006');
    expect(jammedCase).toBeDefined();
    expect(jammedCase.dispenseStatus).toBe('JAMMED');
  });

  it('should detect stock mismatches when physical stock differs from expected stock', async () => {
    const res = await request(app)
      .get('/api/v1/reconciliation')
      .set('Authorization', `Bearer ${token}`);

    const stockMismatches = res.body.data.stockMismatches;
    expect(stockMismatches.length).toBeGreaterThan(0);
  });
});
