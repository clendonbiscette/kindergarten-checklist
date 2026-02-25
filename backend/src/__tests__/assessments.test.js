/**
 * Assessment access control tests — verifies that cross-school data
 * isolation works correctly (Phase 5 fix).
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
    user: { findUnique: vi.fn() },
    userAssignment: { findMany: vi.fn() },
    school: { findUnique: vi.fn() },
    student: { findUnique: vi.fn() },
    academicTerm: { findUnique: vi.fn(), findMany: vi.fn() },
    assessment: { findMany: vi.fn(), create: vi.fn(), findUnique: vi.fn() },
    auditLog: { create: vi.fn().mockResolvedValue({}) },
  },
}));

import prisma from '../utils/prisma.js';
import { verifyToken } from '../utils/jwt.js';

const SCHOOL_A = '11111111-1111-4111-8111-111111111111';
const SCHOOL_B = '22222222-2222-4222-8222-222222222222';
const TERM_B   = '33333333-3333-4333-8333-333333333333';

const app = createApp();

// ── Tests ────────────────────────────────────────────────────────────────────

describe('GET /api/assessments/term/:termId — cross-school protection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Teacher is assigned to SCHOOL_A only
    verifyToken.mockReturnValue({
      userId: 'teacher-1', role: 'TEACHER',
      email: 't@test.com', firstName: 'Test', lastName: 'Teacher',
    });
  });

  it('returns 403 when teacher requests term belonging to a different school', async () => {
    // Term belongs to SCHOOL_B
    prisma.academicTerm.findUnique.mockResolvedValue({ schoolId: SCHOOL_B });
    // Teacher is only assigned to SCHOOL_A
    prisma.userAssignment.findMany.mockResolvedValue([{ schoolId: SCHOOL_A }]);

    const res = await request(app)
      .get(`/api/assessments/term/${TERM_B}`)
      .set('Authorization', 'Bearer mock-token');

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('returns 200 when teacher requests term from their own school', async () => {
    // Term belongs to SCHOOL_A (teacher's school)
    prisma.academicTerm.findUnique.mockResolvedValue({ schoolId: SCHOOL_A });
    prisma.userAssignment.findMany.mockResolvedValue([{ schoolId: SCHOOL_A }]);
    prisma.assessment.findMany.mockResolvedValue([]);

    const res = await request(app)
      .get(`/api/assessments/term/${SCHOOL_A}`)
      .set('Authorization', 'Bearer mock-token');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('returns 404 when term does not exist', async () => {
    prisma.academicTerm.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .get(`/api/assessments/term/${TERM_B}`)
      .set('Authorization', 'Bearer mock-token');

    expect(res.status).toBe(404);
  });

  it('returns 401 with no token', async () => {
    const res = await request(app).get(`/api/assessments/term/${TERM_B}`);
    expect(res.status).toBe(401);
  });
});
