import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from './testApp.js';

// ── Mocks (hoisted before imports by Vitest) ─────────────────────────────────

vi.mock('../utils/jwt.js', () => ({
  verifyToken: vi.fn(),
  signAccessToken: vi.fn(() => 'mock-access-token'),
  signRefreshToken: vi.fn(() => 'mock-refresh-token'),
}));

vi.mock('../utils/prisma.js', () => ({
  default: {
    user: { findUnique: vi.fn(), create: vi.fn() },
    userAssignment: { findFirst: vi.fn(), create: vi.fn(), findMany: vi.fn() },
    school: { findUnique: vi.fn() },
    auditLog: { create: vi.fn().mockResolvedValue({}) },
  },
}));

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('$2a$10$mockhash'),
    compare: vi.fn(),
  },
}));

// ── Imports (after mocks are registered) ─────────────────────────────────────

import prisma from '../utils/prisma.js';
import bcrypt from 'bcryptjs';
import { verifyToken } from '../utils/jwt.js';

const app = createApp();

// ── Tests ────────────────────────────────────────────────────────────────────

describe('POST /api/auth/register/teacher — validation middleware', () => {
  it('returns 400 when email is missing', async () => {
    const res = await request(app)
      .post('/api/auth/register/teacher')
      .send({ firstName: 'John', lastName: 'Doe', password: 'Password1', schoolId: '123e4567-e89b-12d3-a456-426614174000' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 when password is fewer than 8 characters', async () => {
    const res = await request(app)
      .post('/api/auth/register/teacher')
      .send({ email: 'test@test.com', firstName: 'John', lastName: 'Doe', password: 'Sh0rt', schoolId: '123e4567-e89b-12d3-a456-426614174000' });
    expect(res.status).toBe(400);
    expect(res.body.errors.some(e => e.field === 'password')).toBe(true);
  });

  it('returns 400 when password lacks an uppercase letter', async () => {
    const res = await request(app)
      .post('/api/auth/register/teacher')
      .send({ email: 'test@test.com', firstName: 'John', lastName: 'Doe', password: 'alllower1', schoolId: '123e4567-e89b-12d3-a456-426614174000' });
    expect(res.status).toBe(400);
    expect(res.body.errors.some(e => e.field === 'password')).toBe(true);
  });

  it('returns 400 when schoolId is not a UUID', async () => {
    const res = await request(app)
      .post('/api/auth/register/teacher')
      .send({ email: 'test@test.com', firstName: 'John', lastName: 'Doe', password: 'Password1', schoolId: 'not-a-uuid' });
    expect(res.status).toBe(400);
    expect(res.body.errors.some(e => e.field === 'schoolId')).toBe(true);
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 when user does not exist', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@test.com', password: 'Password1' });
    expect(res.status).toBe(401);
  });

  it('returns 403 when account is deactivated', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1', email: 'teacher@test.com', passwordHash: '$2a$10$h', isActive: false, role: 'TEACHER',
    });
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'teacher@test.com', password: 'Password1' });
    expect(res.status).toBe(403);
  });

  it('returns 401 when password is wrong', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1', email: 'teacher@test.com', passwordHash: '$2a$10$h', isActive: true, role: 'TEACHER',
    });
    bcrypt.compare.mockResolvedValue(false);
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'teacher@test.com', password: 'WrongPass1' });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/auth/profile — authentication', () => {
  it('returns 401 with no token', async () => {
    const res = await request(app).get('/api/auth/profile');
    expect(res.status).toBe(401);
  });

  it('returns 401 with an invalid token', async () => {
    verifyToken.mockImplementation(() => { throw new Error('Invalid'); });
    const res = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', 'Bearer bad-token');
    expect(res.status).toBe(401);
  });
});
