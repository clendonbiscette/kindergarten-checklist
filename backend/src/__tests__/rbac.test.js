/**
 * RBAC tests — verifies that role-based access control middleware correctly
 * gates routes so that lower-privileged roles cannot reach higher-privileged
 * endpoints.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from './testApp.js';

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('../utils/jwt.js', () => ({
  verifyToken: vi.fn(),
  signAccessToken: vi.fn(),
  signRefreshToken: vi.fn(),
}));

vi.mock('../utils/prisma.js', () => ({
  default: {
    user: { findUnique: vi.fn(), count: vi.fn(), findMany: vi.fn() },
    userAssignment: { findMany: vi.fn() },
    school: { findMany: vi.fn(), count: vi.fn() },
    student: { count: vi.fn() },
    assessment: { count: vi.fn() },
    auditLog: { create: vi.fn().mockResolvedValue({}) },
  },
}));

import { verifyToken } from '../utils/jwt.js';

const app = createApp();

// ── Helpers ──────────────────────────────────────────────────────────────────

const authHeader = (role) => {
  verifyToken.mockReturnValue({ userId: `user-${role}`, role, email: `${role}@test.com`, firstName: 'Test', lastName: 'User' });
  return 'Bearer mock-token';
};

// ── Tests ────────────────────────────────────────────────────────────────────

describe('Admin routes — SUPERUSER-only guard', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 403 when a TEACHER hits GET /api/admin/users', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', authHeader('TEACHER'));
    expect(res.status).toBe(403);
  });

  it('returns 403 when a SCHOOL_ADMIN hits GET /api/admin/users', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', authHeader('SCHOOL_ADMIN'));
    expect(res.status).toBe(403);
  });

  it('returns 403 when a COUNTRY_ADMIN hits GET /api/admin/users', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', authHeader('COUNTRY_ADMIN'));
    expect(res.status).toBe(403);
  });

  it('returns 401 when no token is provided', async () => {
    const res = await request(app).get('/api/admin/users');
    expect(res.status).toBe(401);
  });
});

describe('School Admin routes — role guard', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 403 when a TEACHER hits GET /api/schools/my-school', async () => {
    const res = await request(app)
      .get('/api/schools/my-school')
      .set('Authorization', authHeader('TEACHER'));
    expect(res.status).toBe(403);
  });

  it('returns 403 when a COUNTRY_ADMIN hits GET /api/schools/my-school', async () => {
    const res = await request(app)
      .get('/api/schools/my-school')
      .set('Authorization', authHeader('COUNTRY_ADMIN'));
    expect(res.status).toBe(403);
  });
});
