import express from 'express';
import {
  getStudentReport,
  getStudentSubjectReport,
  getStrandReport,
  getOutcomeReport,
  getClassSummary,
  getSchoolSummary,
  exportReport,
} from '../controllers/reportController.js';
import { authenticate, authorize, verifyStudentAccess, verifySchoolAccess, verifyClassAccess } from '../middleware/auth.js';
import { validateUuidParam } from '../middleware/validation.js';

const router = express.Router();

// All report routes require authentication
router.use(authenticate);

// Student report (By Learner) - Teachers can access their students, Admins can access school students
router.get(
  '/student/:studentId',
  validateUuidParam('studentId'),
  verifyStudentAccess,
  getStudentReport
);

// Student-Subject detailed report (matching template format with date columns)
// Note: subjectId is not validated as UUID since curriculum IDs may use different formats
router.get(
  '/student/:studentId/subject/:subjectId',
  validateUuidParam('studentId'),
  verifyStudentAccess,
  getStudentSubjectReport
);

// Strand report (By Strand) - Teachers can access their class, Admins can access any class in school
router.get(
  '/strand/:strandId',
  validateUuidParam('strandId'),
  verifyClassAccess,
  getStrandReport
);

// Outcome report (By SCO) - Teachers can access their class, Admins can access any class in school
router.get(
  '/outcome/:outcomeId',
  validateUuidParam('outcomeId'),
  verifyClassAccess,
  getOutcomeReport
);

// Class summary - Teachers can access their class, Admins can access any class in school
router.get(
  '/class/:classId/summary',
  validateUuidParam('classId'),
  verifyClassAccess,
  getClassSummary
);

// School summary - School Admins only
router.get(
  '/school/:schoolId/summary',
  authorize('SCHOOL_ADMIN', 'COUNTRY_ADMIN', 'SUPERUSER'),
  validateUuidParam('schoolId'),
  verifySchoolAccess,
  getSchoolSummary
);

// Export report to CSV or PDF - available to all authenticated users
router.post('/export', exportReport);

export default router;
