/**
 * School scope tests — verifies that TEACHER role only sees schools
 * within their assigned scope.
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
    school: { findUnique: vi.fn(), findMany: vi.fn() },
    country: { findMany: vi.fn() },
    auditLog: { create: vi.fn().mockResolvedValue({}) },
  },
}));

import prisma from '../utils/prisma.js';
import { verifyToken } from '../utils/jwt.js';

const COUNTRY_A  = 'aaaa0000-0000-0000-0000-000000000000';
const COUNTRY_B  = 'bbbb0000-0000-0000-0000-000000000000';
const SCHOOL_A1  = 'a1000000-0000-0000-0000-000000000000';
const SCHOOL_B1  = 'b1000000-0000-0000-0000-000000000000';

const app = createApp();

// ── Tests ────────────────────────────────────────────────────────────────────

describe('GET /api/schools — TEACHER scoping', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    verifyToken.mockReturnValue({
      userId: 'teacher-1', role: 'TEACHER',
      email: 'teacher@test.com', firstName: 'Test', lastName: 'Teacher',
    });
    // Teacher assigned to SCHOOL_A1 only
    prisma.userAssignment.findMany.mockResolvedValue([{ schoolId: SCHOOL_A1 }]);
  });

  it('filters schools to assigned schools only', async () => {
    prisma.school.findMany.mockResolvedValue([
      { id: SCHOOL_A1, name: 'School A1', countryId: COUNTRY_A, country: { name: 'Country A', code: 'CA' }, _count: { students: 5 } },
    ]);

    const res = await request(app)
      .get('/api/schools')
      .set('Authorization', 'Bearer mock-token');

    expect(res.status).toBe(200);
    const whereArg = prisma.school.findMany.mock.calls[0][0].where;
    expect(whereArg).toHaveProperty('id');
    expect(whereArg.id).toEqual({ in: [SCHOOL_A1] });
  });
});

describe('GET /api/schools/:id — TEACHER cross-school guard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    verifyToken.mockReturnValue({
      userId: 'teacher-1', role: 'TEACHER',
      email: 'teacher@test.com', firstName: 'Test', lastName: 'Teacher',
    });
    // Teacher assigned to SCHOOL_A1 only
    prisma.userAssignment.findMany.mockResolvedValue([{ schoolId: SCHOOL_A1 }]);
  });

  it('returns 403 when TEACHER requests a school they are not assigned to', async () => {
    prisma.school.findUnique.mockResolvedValue({ id: SCHOOL_B1, countryId: COUNTRY_B });

    const res = await request(app)
      .get(`/api/schools/${SCHOOL_B1}`)
      .set('Authorization', 'Bearer mock-token');

    expect(res.status).toBe(403);
  });
});
