import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/index.js';

describe('Authentication & RBAC Suite', () => {
  it('should authenticate superadmin and return JWT token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'superadmin@naree.com',
        password: 'Password@123',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.role).toBe('SUPER_ADMIN');
  });

  it('should reject invalid password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'superadmin@naree.com',
        password: 'WrongPassword999',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('should return 401 when accessing protected route without token', async () => {
    const res = await request(app).get('/api/v1/machines');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
