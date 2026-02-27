import express from 'express';
import {
  createAssessment,
  getStudentAssessments,
  getOutcomeHistory,
  updateAssessment,
  deleteAssessment,
  getTermAssessments,
} from '../controllers/assessmentController.js';
import { authenticate, authorize, verifyStudentAccess, verifyAssessmentAccess } from '../middleware/auth.js';
import { validateCreateAssessment, validateUpdateAssessment, validateUuidParam } from '../middleware/validation.js';

const router = express.Router();

// All assessment routes require authentication
router.use(authenticate);

// Create assessment
router.post('/', authorize('TEACHER', 'SUPERUSER'), validateCreateAssessment, verifyStudentAccess, createAssessment);

// Get assessments for a student - verify student belongs to user's school
router.get('/student/:studentId', validateUuidParam('studentId'), verifyStudentAccess, getStudentAssessments);

// Get assessment history for a specific outcome and student
router.get('/student/:studentId/outcome/:outcomeId', validateUuidParam('studentId'), validateUuidParam('outcomeId'), verifyStudentAccess, getOutcomeHistory);

// Get assessments by term (for class reports)
router.get('/term/:termId', validateUuidParam('termId'), getTermAssessments);

// Update assessment
router.put('/:id', authorize('TEACHER', 'SUPERUSER'), validateUpdateAssessment, verifyAssessmentAccess, updateAssessment);

// Delete assessment
router.delete('/:id', validateUuidParam('id'), authorize('TEACHER', 'SUPERUSER'), verifyAssessmentAccess, deleteAssessment);

export default router;
