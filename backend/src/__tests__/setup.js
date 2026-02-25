// Set required env vars before any module loads.
// vi.mock factories run before imports, so jwt.js and prisma.js are fully
// mocked in tests — but other code paths may still check these vars.
process.env.JWT_SECRET = 'test-jwt-secret-that-is-at-least-32-chars-long-for-testing';
process.env.REFRESH_SECRET = 'test-refresh-secret-that-is-at-least-32-chars-long-for-test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.DIRECT_URL = 'postgresql://test:test@localhost:5432/test';
process.env.NODE_ENV = 'test';
