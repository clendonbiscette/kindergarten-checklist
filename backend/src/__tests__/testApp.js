/**
 * Creates a minimal Express app using the backend routes.
 * Used by all test files to avoid importing the root api/index.js
 * (which has different node_modules resolution).
 */
import express from 'express';
import authRoutes from '../routes/auth.js';
import assessmentRoutes from '../routes/assessments.js';
import schoolRoutes from '../routes/schools.js';
import adminRoutes from '../routes/admin.js';

export function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  app.use('/api/assessments', assessmentRoutes);
  app.use('/api/schools', schoolRoutes);
  app.use('/api/admin', adminRoutes);

  // Error handler
  app.use((err, req, res, _next) => {
    res.status(err.status || 500).json({ success: false, message: err.message });
  });

  return app;
}
