import 'dotenv/config';
import * as Sentry from '@sentry/node';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.js';
import assessmentRoutes from './routes/assessments.js';
import curriculumRoutes from './routes/curriculum.js';
import studentRoutes from './routes/students.js';
import schoolRoutes from './routes/schools.js';
import classRoutes from './routes/classes.js';
import adminRoutes from './routes/admin.js';
import termRoutes from './routes/terms.js';
import reportRoutes from './routes/reports.js';
import supportRoutes from './routes/support.js';

// Init Sentry before registering routes (captures unhandled errors)
if (process.env.SENTRY_DSN) {
  Sentry.init({ dsn: process.env.SENTRY_DSN });
}

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// HTTP request logging
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'OHPC Kindergarten Assessment API is running',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/curriculum', curriculumRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/schools', schoolRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/terms', termRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/support', supportRoutes);

// 404 handler
app.use(notFound);

// Sentry error handler (must be before custom error handler)
if (process.env.SENTRY_DSN) {
  app.use(Sentry.expressErrorHandler());
}

// Error handler (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health\n`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});
