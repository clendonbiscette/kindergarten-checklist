/**
 * School scope tests — verifies that COUNTRY_ADMIN and SCHOOL_ADMIN roles
 * only see schools within their assigned scope (Phase 3 fix).
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

describe('GET /api/schools — COUNTRY_ADMIN scoping', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // COUNTRY_ADMIN assigned to COUNTRY_A
    verifyToken.mockReturnValue({
      userId: 'cadmin-1', role: 'COUNTRY_ADMIN',
      email: 'cadmin@test.com', firstName: 'Country', lastName: 'Admin',
    });
    // userAssignment returns country assignment
    prisma.userAssignment.findMany.mockResolvedValue([{ countryId: COUNTRY_A }]);
  });

  it('filters schools to the assigned country', async () => {
    // Only SCHOOL_A1 (in COUNTRY_A) should be returned
    prisma.school.findMany.mockResolvedValue([
      { id: SCHOOL_A1, name: 'School A1', countryId: COUNTRY_A, country: { name: 'Country A', code: 'CA' }, _count: { students: 5 } },
    ]);

    const res = await request(app)
      .get('/api/schools')
      .set('Authorization', 'Bearer mock-token');

    expect(res.status).toBe(200);
    // The controller uses req.userCountryIds to filter — verify prisma received
    // countryId: { in: [COUNTRY_A] } (not COUNTRY_B)
    const whereArg = prisma.school.findMany.mock.calls[0][0].where;
    expect(whereArg).toHaveProperty('countryId');
    expect(whereArg.countryId).toEqual({ in: [COUNTRY_A] });
  });
});

describe('GET /api/schools — SCHOOL_ADMIN scoping', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    verifyToken.mockReturnValue({
      userId: 'sadmin-1', role: 'SCHOOL_ADMIN',
      email: 'sadmin@test.com', firstName: 'School', lastName: 'Admin',
    });
    // Assigned to SCHOOL_A1 only
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

describe('GET /api/schools/:id — COUNTRY_ADMIN cross-country guard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    verifyToken.mockReturnValue({
      userId: 'cadmin-1', role: 'COUNTRY_ADMIN',
      email: 'cadmin@test.com', firstName: 'Country', lastName: 'Admin',
    });
    prisma.userAssignment.findMany.mockResolvedValue([{ countryId: COUNTRY_A }]);
  });

  it('returns 403 when COUNTRY_ADMIN requests a school in a different country', async () => {
    // School is in COUNTRY_B (not admin's country)
    prisma.school.findUnique.mockResolvedValue({ id: SCHOOL_B1, countryId: COUNTRY_B });

    const res = await request(app)
      .get(`/api/schools/${SCHOOL_B1}`)
      .set('Authorization', 'Bearer mock-token');

    expect(res.status).toBe(403);
  });
});
