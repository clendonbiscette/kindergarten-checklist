import express from 'express';
import cors from 'cors';

// Import routes from backend
import authRoutes from '../backend/src/routes/auth.js';
import assessmentRoutes from '../backend/src/routes/assessments.js';
import curriculumRoutes from '../backend/src/routes/curriculum.js';
import studentRoutes from '../backend/src/routes/students.js';
import schoolRoutes from '../backend/src/routes/schools.js';
import classRoutes from '../backend/src/routes/classes.js';
import adminRoutes from '../backend/src/routes/admin.js';
import termRoutes from '../backend/src/routes/terms.js';
import reportRoutes from '../backend/src/routes/reports.js';

const app = express();

// Middleware
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'OHPC Kindergarten Assessment API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
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

// 404 handler for API routes (Express 5 requires named parameter)
app.use('/api/{*splat}', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.path}`,
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

export default app;
