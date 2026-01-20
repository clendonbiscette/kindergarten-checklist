import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  getUsers,
  getUser,
  createUser,
  updateUser,
  resetUserPassword,
  deactivateUser,
  assignUserToSchool,
  removeUserFromSchool,
  getSchools,
  getStats,
  syncTeacherSchoolAssignments,
} from '../controllers/adminController.js';

const router = express.Router();

// All routes require authentication and SUPERUSER role
router.use(authenticate);
router.use(authorize('SUPERUSER'));

// User management
router.get('/users', getUsers);
router.get('/users/:id', getUser);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.post('/users/:id/reset-password', resetUserPassword);
router.delete('/users/:id', deactivateUser);

// User-school assignments
router.post('/users/:id/assign-school', assignUserToSchool);
router.delete('/users/:id/schools/:schoolId', removeUserFromSchool);

// School management (view all schools with stats)
router.get('/schools', getSchools);

// System statistics
router.get('/stats', getStats);

// Maintenance - sync teacher-school assignments
router.post('/sync-teacher-assignments', syncTeacherSchoolAssignments);

export default router;
